package main

import (
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	rows = 20
	cols = 10
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Define simple tetrominoes as 4x4 matrices
var tetrominoes = [][][]int{
	// I
	{
		{0, 0, 0, 0},
		{1, 1, 1, 1},
		{0, 0, 0, 0},
		{0, 0, 0, 0},
	},
	// O
	{
		{0, 0, 0, 0},
		{0, 2, 2, 0},
		{0, 2, 2, 0},
		{0, 0, 0, 0},
	},
	// T
	{
		{0, 0, 0, 0},
		{3, 3, 3, 0},
		{0, 3, 0, 0},
		{0, 0, 0, 0},
	},
	// S
	{
		{0, 0, 0, 0},
		{0, 4, 4, 0},
		{4, 4, 0, 0},
		{0, 0, 0, 0},
	},
	// Z
	{
		{0, 0, 0, 0},
		{5, 5, 0, 0},
		{0, 5, 5, 0},
		{0, 0, 0, 0},
	},
	// J
	{
		{0, 0, 0, 0},
		{6, 6, 6, 0},
		{0, 0, 6, 0},
		{0, 0, 0, 0},
	},
	// L
	{
		{0, 0, 0, 0},
		{7, 7, 7, 0},
		{7, 0, 0, 0},
		{0, 0, 0, 0},
	},
}

type Game struct {
	Board    [][]int `json:"board"`
	Piece    []int   `json:"piece"` // flattened 4x4
	PieceID  int     `json:"pieceId"`
	X        int     `json:"x"`
	Y        int     `json:"y"`
	Score    int     `json:"score"`
	GameOver bool    `json:"gameOver"`
	mutex    sync.Mutex
}

func newGame() *Game {
	b := make([][]int, rows)
	for i := range b {
		b[i] = make([]int, cols)
	}
	g := &Game{Board: b}
	g.spawn()
	return g
}

func flatten(mat [][]int) []int {
	out := make([]int, 16)
	for y := 0; y < 4; y++ {
		for x := 0; x < 4; x++ {
			out[y*4+x] = mat[y][x]
		}
	}
	return out
}

func rotatePiece(piece []int) []int {
	// rotate 4x4 matrix clockwise
	out := make([]int, 16)
	for y := 0; y < 4; y++ {
		for x := 0; x < 4; x++ {
			out[x*4+(3-y)] = piece[y*4+x]
		}
	}
	return out
}

func (g *Game) spawn() {
	id := rand.Intn(len(tetrominoes))
	g.Piece = flatten(tetrominoes[id])
	g.PieceID = id + 1
	g.X = (cols / 2) - 2
	g.Y = 0
}

func (g *Game) collides(px, py int, p []int) bool {
	for y := 0; y < 4; y++ {
		for x := 0; x < 4; x++ {
			v := p[y*4+x]
			if v == 0 {
				continue
			}
			bx := px + x
			by := py + y
			if bx < 0 || bx >= cols || by < 0 || by >= rows {
				return true
			}
			if g.Board[by][bx] != 0 {
				return true
			}
		}
	}
	return false
}

func (g *Game) lock() {
	for y := 0; y < 4; y++ {
		for x := 0; x < 4; x++ {
			v := g.Piece[y*4+x]
			if v == 0 {
				continue
			}
			bx := g.X + x
			by := g.Y + y
			if by >= 0 && by < rows && bx >= 0 && bx < cols {
				g.Board[by][bx] = v
			}
		}
	}
	g.clearLines()
	g.spawn()
	if g.collides(g.X, g.Y, g.Piece) {
		g.GameOver = true
	}
}

func (g *Game) clearLines() {
	newBoard := make([][]int, 0, rows)
	cleared := 0
	for y := 0; y < rows; y++ {
		full := true
		for x := 0; x < cols; x++ {
			if g.Board[y][x] == 0 {
				full = false
				break
			}
		}
		if !full {
			newBoard = append(newBoard, g.Board[y])
		} else {
			cleared++
		}
	}
	for i := 0; i < cleared; i++ {
		newBoard = append([][]int{make([]int, cols)}, newBoard...)
	}
	g.Board = newBoard
	g.Score += cleared * 100
}

func (g *Game) step() {
	g.mutex.Lock()
	defer g.mutex.Unlock()
	if g.GameOver {
		return
	}
	if !g.collides(g.X, g.Y+1, g.Piece) {
		g.Y++
	} else {
		g.lock()
	}
}

type wsMessage struct {
	Type string `json:"type"`
	Dir  string `json:"dir,omitempty"`
}

// GameState is a copy of Game safe to send over the wire
type GameState struct {
	Board    [][]int `json:"board"`
	Piece    []int   `json:"piece"`
	PieceID  int     `json:"pieceId"`
	X        int     `json:"x"`
	Y        int     `json:"y"`
	Score    int     `json:"score"`
	GameOver bool    `json:"gameOver"`
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
	return GameState{
		Board:    b,
		Piece:    p,
		PieceID:  g.PieceID,
		X:        g.X,
		Y:        g.Y,
		Score:    g.Score,
		GameOver: g.GameOver,
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

	// Read controls
	go func() {
		for {
			var msg wsMessage
			if err := conn.ReadJSON(&msg); err != nil {
				close(quit)
				return
			}
			g.mutex.Lock()
			if g.GameOver {
				g.mutex.Unlock()
				continue
			}
			switch msg.Type {
			case "move":
				if msg.Dir == "left" {
					if !g.collides(g.X-1, g.Y, g.Piece) {
						g.X--
					}
				} else if msg.Dir == "right" {
					if !g.collides(g.X+1, g.Y, g.Piece) {
						g.X++
					}
				} else if msg.Dir == "down" {
					if !g.collides(g.X, g.Y+1, g.Piece) {
						g.Y++
					}
				}
			case "rotate":
				rotated := rotatePiece(g.Piece)
				if !g.collides(g.X, g.Y, rotated) {
					g.Piece = rotated
				}
			case "drop":
				for !g.collides(g.X, g.Y+1, g.Piece) {
					g.Y++
				}
				g.lock()
			}
			g.mutex.Unlock()
			// send update after processing control (use snapshot and serialize writes)
			writeMu.Lock()
			conn.WriteJSON(snapshot(g))
			writeMu.Unlock()
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
	rand.Seed(time.Now().UnixNano())
	fs := http.FileServer(http.Dir("../frontend"))
	http.Handle("/", fs)
	http.HandleFunc("/ws", wsHandler)

	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// To run use: PS C:\Users\ottoa\OneDrive\Skrivbord\Go Tetris\backend> Set-Location -LiteralPath 'C:\Users\ottoa\OneDrive\Skrivbord\Go Tetris\backend'; go run .
