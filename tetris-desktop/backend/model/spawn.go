package model

import (
	"log"
	"math/rand"
)

// NewGame creates a new game instance
func NewGame(mode GameMode) *Game {
	b := make([][]int, Rows)
	for i := range b {
		b[i] = make([]int, Cols)
	}
	g := &Game{Board: b, Mode: mode}
	// initialize next queue
	g.Next = make([][]int, 0, 3)
	for i := 0; i < 3; i++ {
		id := rand.Intn(len(Tetrominoes))
		g.Next = append(g.Next, Flatten(Tetrominoes[id]))
	}
	g.spawn()
	log.Println("New game created. X:", g.X, "Y:", g.Y, "GameOver:", g.GameOver)
	return g
}

func (g *Game) spawn() {
	if len(g.Next) == 0 {
		id := rand.Intn(len(Tetrominoes))
		g.Piece = Flatten(Tetrominoes[id])
		g.PieceID = id + 1
	} else {
		g.Piece = make([]int, 16)
		copy(g.Piece, g.Next[0])
		pid := 0
		for _, v := range g.Piece {
			if v != 0 {
				pid = v
				break
			}
		}
		g.PieceID = pid
		if len(g.Next) > 1 {
			g.Next = append(g.Next[:0], g.Next[1:]...)
		} else {
			g.Next = g.Next[:0]
		}
		id := rand.Intn(len(Tetrominoes))
		g.Next = append(g.Next, Flatten(Tetrominoes[id]))
	}
	g.X = (Cols / 2) - 2
	g.Y = 0
}
