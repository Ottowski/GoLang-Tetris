package server

import (
	"encoding/json"
	"net/http"
	"tetris-game/backend/model"
)

// getModeFromSessionOrDefault returns a GameMode based on query or default
func (s *Server) getModeFromSessionOrDefault(r *http.Request) model.GameMode {
	mode := r.URL.Query().Get("mode")
	switch mode {
	case "classic":
		return s.ClassicMode
	case "beginner":
		fallthrough
	default:
		return s.BeginnerMode
	}
}

// GetGameMode is an HTTP handler returning the chosen/default mode
func (s *Server) GetGameMode(w http.ResponseWriter, r *http.Request) {
	mode := s.getModeFromSessionOrDefault(r)
	json.NewEncoder(w).Encode(mode)
}

// Helper to allow main to register handlers easily
func (s *Server) RegisterHandlers() {
	http.HandleFunc("/ws", s.WSHandler)
	http.HandleFunc("/getGameMode", s.GetGameMode)
}

// Expose a restart message parsing helper
type restartMsg struct {
	Type string `json:"type"`
	Mode string `json:"mode,omitempty"`
}
