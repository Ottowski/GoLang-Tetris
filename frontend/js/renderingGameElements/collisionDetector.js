/**
 * CollisionDetector handles collision detection logic for Tetris pieces.
 * It determines whether a piece can be placed at a given position on the board.
 */
export class CollisionDetector {
    /**
     * Creates a new CollisionDetector instance
     * @param {CanvasManager} canvasManager - The canvas manager for board dimensions
     */
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
    }

    /**
     * Checks if a piece would collide with the board boundaries or existing pieces
     * @param {number[][]} board - The current game board state
     * @param {number[]} piece - The piece shape as a flat array
     * @param {number} px - X position of the piece
     * @param {number} py - Y position of the piece
     * @returns {boolean} True if collision detected, false otherwise
     */
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