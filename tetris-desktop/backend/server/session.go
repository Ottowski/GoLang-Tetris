package server

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"tetris-desktop/backend/model"
	"time"
)

type wsMessage struct {
	Type string `json:"type"`
	Dir  string `json:"dir,omitempty"`
}

// WSHandler handles a websocket connection and runs the game loop
func (s *Server) WSHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := s.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("ws upgrade:", err)
		return
	}
	defer conn.Close()

	g := model.NewGame(s.getModeFromSessionOrDefault(r))
	log.Println("Starting game with mode:", g.Mode.Name)

	var ticker *time.Ticker
	createTicker := func() {
		if ticker != nil {
			ticker.Stop()
		}
		speed := s.BaseSpeed / time.Duration(g.Mode.FallSpeed)
		ticker = time.NewTicker(speed)
	}

	createTicker()
	quit := make(chan struct{})
	var writeMu sync.Mutex
	restartChan := make(chan model.GameMode)

	go func() {
		for {
			var msg wsMessage
			if err := conn.ReadJSON(&msg); err != nil {
				close(quit)
				return
			}

			if msg.Type == "restart" {
				log.Println("Restart message received")
				var rm restartMsg
				data, _ := json.Marshal(msg)
				json.Unmarshal(data, &rm)
				selectedMode := s.getModeFromSessionOrDefault(r)
				switch rm.Mode {
				case "classic":
					selectedMode = s.ClassicMode
				case "beginner":
					selectedMode = s.BeginnerMode
				}
				restartChan <- selectedMode
				continue
			}

			updated := false

			switch msg.Type {
			case "move":
				switch msg.Dir {
				case "left":
					updated = g.MoveLeft()
				case "right":
					updated = g.MoveRight()
				case "down":
					updated = g.MoveDown()
				}
			case "rotate":
				updated = g.Rotate()
			case "drop":
				updated = g.Drop()
			case "pause/resume":
				updated = g.TogglePause()
			}

			if updated {
				writeMu.Lock()
				conn.WriteJSON(g.Snapshot())
				writeMu.Unlock()
			}
		}
	}()

	// send initial state
	writeMu.Lock()
	conn.WriteJSON(g.Snapshot())
	writeMu.Unlock()

	for {
		select {
		case <-quit:
			return
		case mode := <-restartChan:
			g = model.NewGame(mode)
			log.Println("Starting game with mode:", g.Mode.Name)
			createTicker()
			writeMu.Lock()
			conn.WriteJSON(g.Snapshot())
			writeMu.Unlock()
		case <-ticker.C:
			g.Step()
			writeMu.Lock()
			if err := conn.WriteJSON(g.Snapshot()); err != nil {
				writeMu.Unlock()
				return
			}
			writeMu.Unlock()
		}
	}
}
