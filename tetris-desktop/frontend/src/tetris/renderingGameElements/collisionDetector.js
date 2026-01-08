// Detects collisions between Tetris pieces and the game board
export class CollisionDetector {
    // Initializes the CollisionDetector with a reference to the CanvasManager
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
    }

    // Checks if a piece collides with the board or existing pieces
    collides(board, piece, px, py) {
        const COLS = 10; // Board width
        const ROWS = 20; // Board height

        // Check each cell of the 4x4 piece matrix
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const val = piece[y * 4 + x];
                if (val === 0) continue; // Empty cell in piece

                const bx = px + x; // Board X coordinate
                const by = py + y; // Board Y coordinate

                // Check boundaries
                if (bx < 0 || bx >= COLS || by < 0 || by >= ROWS) return true;

                // Check collision with existing pieces
                if (board[by][bx] !== 0) return true;
            }
        }
        return false; // No collision
    }
}