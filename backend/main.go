package main

import (
	"log"
	"net/http"
)

func main() {
	// serve static frontend
	fs := http.FileServer(http.Dir("../frontend"))
	http.Handle("/", fs)

	loadHighscores()

	http.HandleFunc("/start", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		log.Println("Game started")
		w.WriteHeader(http.StatusOK)
	})

	http.HandleFunc("/highscores", highscoresHandler)
	http.HandleFunc("/ws", wsHandler)

	http.HandleFunc("/restart", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok"}`))
		}
	})

	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
