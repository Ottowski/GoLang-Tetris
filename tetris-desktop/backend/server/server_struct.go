package server

import (
	"net/http"
	"tetris-desktop/backend/model"
	"time"

	"github.com/gorilla/websocket"
)

// Server holds config and shared resources for handlers
type Server struct {
	Upgrader     websocket.Upgrader
	BeginnerMode model.GameMode
	ClassicMode  model.GameMode
	BaseSpeed    time.Duration
	// exported so main or tests can read/adjust if needed
	HTTPServer *http.Server
}

// New creates a configured Server instance
func New() *Server {
	s := &Server{
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
		BeginnerMode: model.GameMode{
			Name:            "Beginner",
			GhostPiece:      true,
			NextPreview:     true,
			CanPause:        true,
			FallSpeed:       1,
			ScoreMultiplier: 1.0,
		},
		ClassicMode: model.GameMode{
			Name:            "Classic",
			GhostPiece:      false,
			NextPreview:     false,
			CanPause:        false,
			FallSpeed:       3,
			ScoreMultiplier: 1.5,
		},
		BaseSpeed: 600 * time.Millisecond,
	}
	return s
}
