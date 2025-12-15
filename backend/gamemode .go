package main

type GameMode string

const (
	ModeMenu     GameMode = "menu"
	ModePlaying  GameMode = "playing"
	ModePaused   GameMode = "paused"
	ModeGameOver GameMode = "gameover"
)

type wsMessage struct {
	Type   string `json:"type"`
	Dir    string `json:"dir,omitempty"`
	Action string `json:"action,omitempty"`
}
