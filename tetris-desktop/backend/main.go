package main

import (
	"log"
	"net/http"
	"tetris-desktop/backend/server"
)

func main() {
	// serve static frontend
	fs := http.FileServer(http.Dir("../frontend"))
	http.Handle("/", fs)

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
	// instantiate server and register its handlers
	srv := server.New()
	srv.RegisterHandlers()

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
	})

	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
