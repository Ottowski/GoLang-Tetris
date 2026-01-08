package model

// Step advances the game by one tick
func (g *Game) Step() {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	if g.GameOver || g.Paused {
		return
	}

	if !g.collides(g.X, g.Y+1, g.Piece) {
		g.Y++
	} else {
		g.lock()
	}
}
