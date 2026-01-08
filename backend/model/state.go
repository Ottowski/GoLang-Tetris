package model

import "sync"

// game board dimensions
const (
	Rows = 20
	Cols = 10
)

// GameMode is the difficulty/options structure
type GameMode struct {
	Name            string  `json:"name"`
	GhostPiece      bool    `json:"ghostPiece"`
	NextPreview     bool    `json:"nextPreview"`
	CanPause        bool    `json:"canPause"`
	FallSpeed       int     `json:"fallSpeed"`
	ScoreMultiplier float64 `json:"scoreMultiplier"`
}

// Game is the core game state
type Game struct {
	Board     [][]int  `json:"board"`
	Piece     []int    `json:"piece"`
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

// GameState is a copy safe to send over the wire
type GameState = Game
