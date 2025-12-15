package main

type GameMode string

const (
	ModeMenu     GameMode = "menu"
	ModePlaying  GameMode = "playing"
	ModePaused   GameMode = "paused"
	ModeGameOver GameMode = "gameover"
)
