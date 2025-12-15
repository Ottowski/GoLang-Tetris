package main

import (
	"log"
	"math/rand"
	"sync"
)

const (
	rows = 20
	cols = 10
)

type Game struct {
	Mode      GameMode `json:"mode"`
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
	mutex     sync.Mutex
}

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

func newGame() *Game {
	b := make([][]int, rows)
	for i := range b {
		b[i] = make([]int, cols)
	}
	g := &Game{Board: b}
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
			rowCopy := make([]int, cols)
			copy(rowCopy, g.Board[y])
			newBoard = append(newBoard, rowCopy)
		} else {
			cleared++
		}
	}
	for i := 0; i < cleared; i++ {
		newRow := make([]int, cols)
		newBoard = append([][]int{newRow}, newBoard...)
	}
	g.Board = newBoard
	if cleared > 0 {
		baseScore := cleared * 100
		multiplier := cleared
		g.Score += baseScore * multiplier
	}
}
