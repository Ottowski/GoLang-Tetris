package main

import (
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
	tetrix := NewTetrixField()

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
			// Advance game state
			g.step()
			// Advance tetrix field
			tetrix.Step()
			// Send updated state
			writeMu.Lock()
			// Send combined game state

			// Update every tick with the tetrix field
			if err := conn.WriteJSON(struct {
				Game   GameState      `json:"game"`
				Tetrix []*TetrixPiece `json:"tetrix"`
			}{
				Game:   snapshot(g),
				Tetrix: tetrix.Snapshot(),
			}); err != nil {
				writeMu.Unlock()
				return
			}
			writeMu.Unlock()
		}
	}
}
