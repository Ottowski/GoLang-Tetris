package model

// movement and action methods
func (g *Game) MoveLeft() bool {
	g.mutex.Lock()
	defer g.mutex.Unlock()
	if g.GameOver {
		return false
	}
	if !g.collides(g.X-1, g.Y, g.Piece) {
		g.X--
		return true
	}
	return false
}

func (g *Game) MoveRight() bool {
	g.mutex.Lock()
	defer g.mutex.Unlock()
	if g.GameOver {
		return false
	}
	if !g.collides(g.X+1, g.Y, g.Piece) {
		g.X++
		return true
	}
	return false
}

func (g *Game) MoveDown() bool {
	g.mutex.Lock()
	defer g.mutex.Unlock()
	if g.GameOver {
		return false
	}
	if !g.collides(g.X, g.Y+1, g.Piece) {
		g.Y++
		return true
	}
	return false
}

func (g *Game) Rotate() bool {
	g.mutex.Lock()
	defer g.mutex.Unlock()
	if g.GameOver {
		return false
	}
	rotated := RotatePiece(g.Piece)

	// Try rotation at current position
	if !g.collides(g.X, g.Y, rotated) {
		g.Piece = rotated
		return true
	}

	// Wall kick: try shifting right
	if !g.collides(g.X+1, g.Y, rotated) {
		g.X++
		g.Piece = rotated
		return true
	}

	// Wall kick: try shifting left
	if !g.collides(g.X-1, g.Y, rotated) {
		g.X--
		g.Piece = rotated
		return true
	}

	// Wall kick: try shifting right by 2 (for I-piece)
	if !g.collides(g.X+2, g.Y, rotated) {
		g.X += 2
		g.Piece = rotated
		return true
	}

	// Wall kick: try shifting left by 2 (for I-piece)
	if !g.collides(g.X-2, g.Y, rotated) {
		g.X -= 2
		g.Piece = rotated
		return true
	}

	return false
}

func (g *Game) Drop() bool {
	g.mutex.Lock()
	defer g.mutex.Unlock()
	if g.GameOver {
		return false
	}
	for !g.collides(g.X, g.Y+1, g.Piece) {
		g.Y++
	}
	g.lock()
	return true
}

func (g *Game) TogglePause() bool {
	g.mutex.Lock()
	defer g.mutex.Unlock()
	if !g.Mode.CanPause {
		return false
	}
	g.Paused = !g.Paused
	return true
}
