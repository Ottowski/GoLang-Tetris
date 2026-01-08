package model

// Snapshot returns a deep copy of the game state safe for sending
func (g *Game) Snapshot() GameState {
	g.mutex.Lock()
	defer g.mutex.Unlock()
	b := make([][]int, len(g.Board))
	for i := range g.Board {
		row := make([]int, len(g.Board[i]))
		copy(row, g.Board[i])
		b[i] = row
	}
	p := make([]int, len(g.Piece))
	copy(p, g.Piece)
	n := make([][]int, len(g.Next))
	for i := range g.Next {
		if g.Next[i] == nil {
			n[i] = nil
			continue
		}
		pi := make([]int, len(g.Next[i]))
		copy(pi, g.Next[i])
		n[i] = pi
	}
	return GameState{
		Board:    b,
		Piece:    p,
		Next:     n,
		PieceID:  g.PieceID,
		X:        g.X,
		Y:        g.Y,
		Score:    g.Score,
		GameOver: g.GameOver,
		Paused:   g.Paused,
		Mode:     g.Mode,
	}
}
