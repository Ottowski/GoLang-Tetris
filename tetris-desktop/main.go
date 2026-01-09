package main

import (
	"embed"
	"encoding/json"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
	"sync"
	"time"

	"tetris-desktop/backend/server"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var embeddedAssets embed.FS

// Highscore entry
type Highscore struct {
	Name  string    `json:"name"`
	Score int       `json:"score"`
	When  time.Time `json:"when"`
}

var (
	hsFile     string
	hsMu       sync.Mutex
	highscores []Highscore
	maxHS      = 10
)

func init() {
	// Use executable directory for highscores file
	exePath, err := os.Executable()
	if err != nil {
		log.Println("Failed to get executable path:", err)
		hsFile = "highscores.json"
	} else {
		exeDir := strings.TrimSuffix(exePath, "\\"+os.Args[0])
		if idx := strings.LastIndex(exePath, "\\"); idx >= 0 {
			exeDir = exePath[:idx]
		}
		hsFile = exeDir + "\\highscores.json"
	}
	log.Println("Highscores file:", hsFile)
}

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
	// Add CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case http.MethodGet:
		log.Println("GET /highscores - returning", len(highscores), "entries")
		hsMu.Lock()
		out := make([]Highscore, len(highscores))
		copy(out, highscores)
		hsMu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(out)
		return

	case http.MethodPost:
		log.Println("POST /highscores - receiving new score")
		var req struct {
			Name  string `json:"name"`
			Score int    `json:"score"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Println("POST /highscores - decode error:", err)
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		log.Println("POST /highscores - name:", req.Name, "score:", req.Score)
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

func startBackendServer() {
	// Load highscores at startup
	loadHighscores()

	// API endpoints
	http.HandleFunc("/start", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		log.Println("Game started")
		w.WriteHeader(http.StatusOK)
	})

	http.HandleFunc("/highscores", highscoresHandler)

	http.HandleFunc("/restart", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok"}`))
		}
	})

	http.HandleFunc("/quit", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		log.Println("Game quit")
		w.WriteHeader(http.StatusOK)
		os.Exit(0)
	})

	// instantiate server and register its handlers
	srv := server.New()
	srv.RegisterHandlers()

	go func() {
		log.Println("Backend server listening on :8081")
		log.Fatal(http.ListenAndServe(":8081", nil))
	}()

	// Wait for server to start
	time.Sleep(100 * time.Millisecond)
}

func main() {
	// Start the backend server
	startBackendServer()

	// Create an instance of the app structure
	app := NewApp()

	// Strip the frontend/dist prefix from embedded files
	assets, err := fs.Sub(embeddedAssets, "frontend/dist")
	if err != nil {
		log.Fatal(err)
	}

	// Create application with options
	err = wails.Run(&options.App{
		Title:  "tetris-desktop",
		Width:  1280,
		Height: 900,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
