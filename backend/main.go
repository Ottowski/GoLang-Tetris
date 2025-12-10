package main

import (
	"log"
	"net/http"
)

func main() {
	// start server
	loadHighscores()
	fs := http.FileServer(http.Dir("../frontend"))
	http.HandleFunc("/highscores", highscoresHandler)
	http.Handle("/", fs)
	http.HandleFunc("/ws", wsHandler)
	http.HandleFunc("/restart", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok"}`))
		}
	})

	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
