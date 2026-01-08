package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
	"sync"
	"time"
)

// Highscore entry
type Highscore struct {
	Name  string    `json:"name"`
	Score int       `json:"score"`
	When  time.Time `json:"when"`
}

var (
	hsFile     = "highscores.json"
	hsMu       sync.Mutex
	highscores []Highscore
	maxHS      = 10
)

// load highscores from file (call once at startup)
func loadHighscores() {
	hsMu.Lock()
	defer hsMu.Unlock()

	f, err := os.Open(hsFile)
	if err != nil {
		if os.IsNotExist(err) {
			highscores = []Highscore{}
			return
		}
		log.Println("loadHighscores open:", err)
		highscores = []Highscore{}
		return
	}
	defer f.Close()
	dec := json.NewDecoder(f)
	var hs []Highscore
	if err := dec.Decode(&hs); err != nil && err != io.EOF {
		log.Println("loadHighscores decode:", err)
		highscores = []Highscore{}
		return
	}
	highscores = hs
}

// save highscores to file
func saveHighscores() {
	hsMu.Lock()
	defer hsMu.Unlock()
	tmp := hsFile + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		log.Println("saveHighscores create tmp:", err)
		return
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(highscores); err != nil {
		log.Println("saveHighscores encode:", err)
		f.Close()
		return
	}
	f.Close()
	if err := os.Rename(tmp, hsFile); err != nil {
		log.Println("saveHighscores rename:", err)
	}
}

// GET /highscores and POST /highscores handler
func highscoresHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		hsMu.Lock()
		out := make([]Highscore, len(highscores))
		copy(out, highscores)
		hsMu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(out)
		return

	case http.MethodPost:
		var req struct {
			Name  string `json:"name"`
			Score int    `json:"score"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		name := strings.TrimSpace(req.Name)
		if name == "" {
			name = "Anonymous"
		}
		if len(name) > 20 {
			name = name[:20]
		}
		entry := Highscore{
			Name:  name,
			Score: req.Score,
			When:  time.Now().UTC(),
		}

		hsMu.Lock()
		// insert and keep sorted desc
		highscores = append(highscores, entry)
		sort.SliceStable(highscores, func(i, j int) bool {
			return highscores[i].Score > highscores[j].Score
		})
		if len(highscores) > maxHS {
			highscores = highscores[:maxHS]
		}
		hsMu.Unlock()

		// persist async-safe (but quick)
		saveHighscores()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"ok": true})
		return
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
}
