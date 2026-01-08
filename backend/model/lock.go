package model

// internal lock
func (g *Game) lock() {
	for y := 0; y < 4; y++ {
		for x := 0; x < 4; x++ {
			v := g.Piece[y*4+x]
			if v == 0 {
				continue
			}
			bx := g.X + x
			by := g.Y + y
			if by >= 0 && by < Rows && bx >= 0 && bx < Cols {
				g.Board[by][bx] = v
			}
		}
	}
	g.clearLines()
	g.spawn()
	if g.collides(g.X, g.Y, g.Piece) {
		g.GameOver = true
	}
}

// clear completed lines and update score
func (g *Game) clearLines() {
	newBoard := make([][]int, 0, Rows)
	cleared := 0
	for y := 0; y < Rows; y++ {
		full := true
		for x := 0; x < Cols; x++ {
			if g.Board[y][x] == 0 {
				full = false
				break
			}
		}
		if !full {
			rowCopy := make([]int, Cols)
			copy(rowCopy, g.Board[y])
			newBoard = append(newBoard, rowCopy)
		} else {
			cleared++
		}
	}
	for i := 0; i < cleared; i++ {
		newRow := make([]int, Cols)
		newBoard = append([][]int{newRow}, newBoard...)
	}
	g.Board = newBoard
	if cleared > 0 {
		baseScore := cleared * 100
		lineMultiplier := cleared
		total := int(float64(baseScore*lineMultiplier) * g.Mode.ScoreMultiplier)
		g.Score += total
	}
}
