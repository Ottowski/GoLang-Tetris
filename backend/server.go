package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
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
	Board     [][]int `json:"board"`
	Piece     []int   `json:"piece"`
	Next      [][]int `json:"next"`
	PieceID   int     `json:"pieceId"`
	X         int     `json:"x"`
	Y         int     `json:"y"`
	Score     int     `json:"score"`
	GameOver  bool    `json:"gameOver"`
	Paused    bool    `json:"paused"`
	HighScore int     `json:"Highscore"`
}

// Highscore entry
type Highscore struct {
	Name  string    `json:"name"`
	Score int       `json:"score"`
	When  time.Time `json:"when"`
}

var (
	hsFile     = "highscores.json"
	hsMu       sync.Mutex
	highscores []Highscore
	maxHS      = 10
)

// load highscores from file (call once at startup)
func loadHighscores() {
	hsMu.Lock()
	defer hsMu.Unlock()

	f, err := os.Open(hsFile)
	if err != nil {
		if os.IsNotExist(err) {
			highscores = []Highscore{}
			return
		}
		log.Println("loadHighscores open:", err)
		highscores = []Highscore{}
		return
	}
	defer f.Close()
	dec := json.NewDecoder(f)
	var hs []Highscore
	if err := dec.Decode(&hs); err != nil && err != io.EOF {
		log.Println("loadHighscores decode:", err)
		highscores = []Highscore{}
		return
	}
	highscores = hs
}

// save highscores to file
func saveHighscores() {
	hsMu.Lock()
	defer hsMu.Unlock()
	tmp := hsFile + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		log.Println("saveHighscores create tmp:", err)
		return
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(highscores); err != nil {
		log.Println("saveHighscores encode:", err)
		f.Close()
		return
	}
	f.Close()
	if err := os.Rename(tmp, hsFile); err != nil {
		log.Println("saveHighscores rename:", err)
	}
}

// GET /highscores and POST /highscores handler
func highscoresHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		hsMu.Lock()
		out := make([]Highscore, len(highscores))
		copy(out, highscores)
		hsMu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(out)
		return

	case http.MethodPost:
		var req struct {
			Name  string `json:"name"`
			Score int    `json:"score"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		name := strings.TrimSpace(req.Name)
		if name == "" {
			name = "Anonymous"
		}
		if len(name) > 20 {
			name = name[:20]
		}
		entry := Highscore{
			Name:  name,
			Score: req.Score,
			When:  time.Now().UTC(),
		}

		hsMu.Lock()
		// insert and keep sorted desc
		highscores = append(highscores, entry)
		sort.SliceStable(highscores, func(i, j int) bool {
			return highscores[i].Score > highscores[j].Score
		})
		if len(highscores) > maxHS {
			highscores = highscores[:maxHS]
		}
		hsMu.Unlock()

		// persist async-safe (but quick)
		saveHighscores()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"ok": true})
		return
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
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
	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("ws upgrade:", err)
		return
	}
	defer conn.Close()

	g := newGame()

	// ticker for game steps
	ticker := time.NewTicker(600 * time.Millisecond)
	defer ticker.Stop()

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
				// Signal restart
				select {
				case restartChan <- struct{}{}:
				default:
				}
				continue
			}

			g.mutex.Lock()
			if g.GameOver {
				g.mutex.Unlock()
				continue
			}

			// State of game signals
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
				g.Paused = !g.Paused
				updated = true
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
			log.Println("Creating new game after restart")
			g = newGame()
			writeMu.Lock()
			conn.WriteJSON(snapshot(g))
			writeMu.Unlock()
		case <-ticker.C:
			g.step()
			writeMu.Lock()
			if err := conn.WriteJSON(snapshot(g)); err != nil {
				writeMu.Unlock()
				return
			}
			writeMu.Unlock()
		}
	}
}

func main() {
	// start server
	loadHighscores()
	fs := http.FileServer(http.Dir("../frontend"))
	http.HandleFunc("/highscores", highscoresHandler)
	http.Handle("/", fs)
	http.HandleFunc("/ws", wsHandler)
	http.HandleFunc("/restart", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok"}`))
		}
	})

	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
