package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type wsMessage struct {
	Type string `json:"type"`
	Dir  string `json:"dir,omitempty"`
}

// GameState is a copy of Game safe to send over the wire
type GameState struct {
	Board     [][]int  `json:"board"`
	Piece     []int    `json:"piece"`
	Next      [][]int  `json:"next"`
	PieceID   int      `json:"pieceId"`
	X         int      `json:"x"`
	Y         int      `json:"y"`
	Score     int      `json:"score"`
	GameOver  bool     `json:"gameOver"`
	Paused    bool     `json:"paused"`
	Mode      GameMode `json:"mode"`
	HighScore int      `json:"Highscore"`
}

// Game modes difficlty defenitions
var BeginnerMode = GameMode{
	Name:        "Beginner",
	GhostPiece:  true,
	NextPreview: true,
	CanPause:    true,
	FallSpeed:   1, // 600 ms
}

var ClassicMode = GameMode{
	Name:        "Classic",
	GhostPiece:  false,
	NextPreview: false,
	CanPause:    false,
	FallSpeed:   3, // 200 ms
}

func snapshot(g *Game) GameState {
	g.mutex.Lock()
	defer g.mutex.Unlock()
	// deep copy board
	b := make([][]int, len(g.Board))
	for i := range g.Board {
		row := make([]int, len(g.Board[i]))
		copy(row, g.Board[i])
		b[i] = row
	}
	// copy piece
	p := make([]int, len(g.Piece))
	copy(p, g.Piece)
	// copy next queue
	n := make([][]int, len(g.Next))
	for i := range g.Next {
		if g.Next[i] == nil {
			n[i] = nil
			continue
		}
		pi := make([]int, len(g.Next[i]))
		copy(pi, g.Next[i])
		n[i] = pi
	}
	return GameState{
		Board:    b,
		Piece:    p,
		Next:     n,
		PieceID:  g.PieceID,
		X:        g.X,
		Y:        g.Y,
		Score:    g.Score,
		GameOver: g.GameOver,
		Paused:   g.Paused,
		Mode:     g.Mode,
	}
}

// API handler to get current game mode
func GetGameMode(w http.ResponseWriter, r *http.Request) {
	mode := getModeFromSessionOrDefault(r)
	json.NewEncoder(w).Encode(mode)
}

// helper to get game mode from session or default
func getModeFromSessionOrDefault(r *http.Request) GameMode {
	mode := r.URL.Query().Get("mode")
	switch mode {
	case "classic":
		return ClassicMode
	case "beginner":
		fallthrough
	default:
		return BeginnerMode
	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("ws upgrade:", err)
		return
	}
	defer conn.Close()

	// create new game
	g := newGame(getModeFromSessionOrDefault(r))
	log.Println("Starting game with mode:", g.Mode.Name)

	// ticker for game steps
	var ticker *time.Ticker
	createTicker := func() {
		if ticker != nil {
			ticker.Stop()
		}
		baseSpeed := 600 * time.Millisecond
		speed := baseSpeed / time.Duration(g.Mode.FallSpeed)
		ticker = time.NewTicker(speed)
	}

	createTicker() // start ticker initially

	// channel to signal quit
	quit := make(chan struct{})

	// mutex to serialize websocket writes (gorilla/websocket requires this)
	var writeMu sync.Mutex

	// channel to signal game restart
	restartChan := make(chan struct{})

	// Read controls
	go func() {
		for {
			var msg wsMessage
			if err := conn.ReadJSON(&msg); err != nil {
				close(quit)
				return
			}

			if msg.Type == "restart" {
				log.Println("Restart message received")

				// default mode
				selectedMode := getModeFromSessionOrDefault(r)

				// check for mode in restart message
				type restartMsg struct {
					Type string `json:"type"`
					Mode string `json:"mode,omitempty"`
				}
				var rm restartMsg
				data, _ := json.Marshal(msg)
				json.Unmarshal(data, &rm)

				switch rm.Mode {
				case "classic":
					selectedMode = ClassicMode
				case "beginner":
					selectedMode = BeginnerMode
				}

				g = newGame(selectedMode)
				log.Println("Starting game with mode:", g.Mode.Name)
				createTicker()
				writeMu.Lock()
				conn.WriteJSON(snapshot(g))
				writeMu.Unlock()
				continue
			}

			g.mutex.Lock()
			if g.GameOver {
				g.mutex.Unlock()
				continue
			}

			updated := false

			switch msg.Type {
			case "move":
				if msg.Dir == "left" && !g.collides(g.X-1, g.Y, g.Piece) {
					g.X--
				} else if msg.Dir == "right" && !g.collides(g.X+1, g.Y, g.Piece) {
					g.X++
				} else if msg.Dir == "down" && !g.collides(g.X, g.Y+1, g.Piece) {
					g.Y++
				}
				updated = true

			case "rotate":
				rotated := rotatePiece(g.Piece)
				if !g.collides(g.X, g.Y, rotated) {
					g.Piece = rotated
				}
				updated = true

			case "drop":
				for !g.collides(g.X, g.Y+1, g.Piece) {
					g.Y++
				}
				g.lock()
				updated = true

			case "pause/resume":
				if g.Mode.CanPause {
					g.Paused = !g.Paused
					updated = true
				}
			}

			g.mutex.Unlock()

			if updated {
				writeMu.Lock()
				conn.WriteJSON(snapshot(g))
				writeMu.Unlock()
			}
		}
	}()

	// Send initial state
	writeMu.Lock()
	conn.WriteJSON(snapshot(g))
	writeMu.Unlock()

	for {
		select {
		case <-quit:
			return

		case <-restartChan:
			// Create a new game on restart
			g = newGame(getModeFromSessionOrDefault(r)) // <--- fixad
			log.Println("Starting game with mode:", g.Mode.Name)
			createTicker() // reset ticker for new game
			writeMu.Lock()
			conn.WriteJSON(snapshot(g))
			writeMu.Unlock()

		case <-ticker.C:
			// Advance game state
			g.step()
			// Send updated state
			writeMu.Lock()
			if err := conn.WriteJSON(snapshot(g)); err != nil {
				writeMu.Unlock()
				return
			}
			writeMu.Unlock()
		}
	}
}
