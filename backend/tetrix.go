package main

import (
	"math/rand"
	"sync"
)

const (
	tetrixCols = 40
	tetrixRows = 30
)

// One falling background piece
type TetrixPiece struct {
	Shape []int `json:"shape"` // flattened 4x4
	X     int   `json:"x"`
	Y     int   `json:"y"`
	Speed int   `json:"speed"`
}

// Entire background field
type TetrixField struct {
	Pieces []*TetrixPiece `json:"pieces"`
	mutex  sync.Mutex
}

// Create a new Tetrix field
func NewTetrixField() *TetrixField {
	return &TetrixField{
		Pieces: make([]*TetrixPiece, 0),
	}
}

// Spawn a random tetromino at the top
func (t *TetrixField) spawn() {
	id := rand.Intn(len(tetrominoes))
	p := &TetrixPiece{
		Shape: flatten(tetrominoes[id]),
		X:     rand.Intn(tetrixCols - 4),
		Y:     -4,
		Speed: rand.Intn(3) + 1, // randomized fall speed
	}
	t.Pieces = append(t.Pieces, p)
}

// Step background animation
func (t *TetrixField) Step() {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	// Random chance to spawn new piece
	if rand.Float64() < 0.05 {
		t.spawn()
	}

	active := t.Pieces[:0]

	for _, p := range t.Pieces {
		p.Y += p.Speed
		if p.Y < tetrixRows {
			active = append(active, p)
		}
	}

	t.Pieces = active
}

// Snapshot safe for JSON
func (t *TetrixField) Snapshot() []*TetrixPiece {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	out := make([]*TetrixPiece, len(t.Pieces))
	for i, p := range t.Pieces {
		cp := *p
		cp.Shape = append([]int(nil), p.Shape...)
		out[i] = &cp
	}
	return out
}
