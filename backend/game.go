package main

import (
	"log"
	"math/rand"
	"sync"
)

// game board dimensions
const (
	rows = 20
	cols = 10
)

// regular struct definition for Game
type Game struct {
	Board     [][]int  `json:"board"`
	Piece     []int    `json:"piece"` // flattened 4x4
	Next      [][]int  `json:"next"`
	PieceID   int      `json:"pieceId"`
	X         int      `json:"x"`
	Y         int      `json:"y"`
	Score     int      `json:"score"`
	GameOver  bool     `json:"gameOver"`
	Paused    bool     `json:"paused"`
	HighScore int      `json:"Highscore"`
	Mode      GameMode `json:"mode"`
	mutex     sync.Mutex
}

// game mode difficulty struct
type GameMode struct {
	Name            string  `json:"name"`
	GhostPiece      bool    `json:"ghostPiece"`
	NextPreview     bool    `json:"nextPreview"`
	CanPause        bool    `json:"canPause"`
	FallSpeed       int     `json:"fallSpeed"`
	ScoreMultiplier float64 `json:"scoreMultiplier"`
}

// advance game state by one step
func (g *Game) step() {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	if g.GameOver {
		return
	}

	// pause stopps game progression
	if g.Paused {
		return
	}

	if !g.collides(g.X, g.Y+1, g.Piece) {
		g.Y++
	} else {
		g.lock()
	}
}

// create a new game instance
func newGame(mode GameMode) *Game {
	b := make([][]int, rows)
	for i := range b {
		b[i] = make([]int, cols)
	}
	g := &Game{Board: b, Mode: mode}
	// initialize next queue (3 upcoming pieces)
	g.Next = make([][]int, 0, 3)
	for i := 0; i < 3; i++ {
		id := rand.Intn(len(tetrominoes))
		g.Next = append(g.Next, flatten(tetrominoes[id]))
	}
	g.spawn()
	log.Println("New game created. X:", g.X, "Y:", g.Y, "GameOver:", g.GameOver)
	return g
}

func (g *Game) spawn() {
	// take first from Next queue
	if len(g.Next) == 0 {
		id := rand.Intn(len(tetrominoes))
		g.Piece = flatten(tetrominoes[id])
		g.PieceID = id + 1
	} else {
		g.Piece = make([]int, 16)
		copy(g.Piece, g.Next[0])
		// determine piece id from piece values (first non-zero value)
		pid := 0
		for _, v := range g.Piece {
			if v != 0 {
				pid = v
				break
			}
		}
		g.PieceID = pid
		// shift queue
		if len(g.Next) > 1 {
			g.Next = append(g.Next[:0], g.Next[1:]...)
		} else {
			g.Next = g.Next[:0]
		}
		// append a new random piece to keep queue length
		id := rand.Intn(len(tetrominoes))
		g.Next = append(g.Next, flatten(tetrominoes[id]))
	}
	g.X = (cols / 2) - 2
	g.Y = 0
}

// check for collision of piece at position (px, py)
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

// lock piece into the board
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

// clear completed lines and update score
func (g *Game) clearLines() {
	newBoard := make([][]int, 0, rows)
	cleared := 0
	for y := 0; y < rows; y++ {
		// check if line is full
		full := true
		for x := 0; x < cols; x++ {
			if g.Board[y][x] == 0 {
				full = false
				break
			}
		}
		// if line is not full, keep it
		if !full {
			rowCopy := make([]int, cols)
			copy(rowCopy, g.Board[y])
			newBoard = append(newBoard, rowCopy)
		} else {
			cleared++
		}
	}
	// add empty rows at the top
	for i := 0; i < cleared; i++ {
		newRow := make([]int, cols)
		newBoard = append([][]int{newRow}, newBoard...)
	}
	g.Board = newBoard
	if cleared > 0 {
		// Base score per cleared line
		baseScore := cleared * 100
		// Line clear bonus (double, triple, tetris etc.)
		lineMultiplier := cleared
		// Apply game mode difficulty multiplier
		total := int(float64(baseScore*lineMultiplier) * g.Mode.ScoreMultiplier)
		g.Score += total
	}
}
