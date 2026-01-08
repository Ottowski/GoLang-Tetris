package model

// internal collision check
func (g *Game) collides(px, py int, p []int) bool {
	for y := 0; y < 4; y++ {
		for x := 0; x < 4; x++ {
			v := p[y*4+x]
			if v == 0 {
				continue
			}
			bx := px + x
			by := py + y
			if bx < 0 || bx >= Cols || by < 0 || by >= Rows {
				return true
			}
			if g.Board[by][bx] != 0 {
				return true
			}
		}
	}
	return false
}
