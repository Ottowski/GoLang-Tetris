import { ColorManager } from './colorManager.js';

// Renders the ghost piece on the Tetris board
export class GhostPieceRenderer {
    // Initializes the GhostPieceRenderer with references to CanvasManager and CollisionDetector
    constructor(canvasManager, collisionDetector) {
        this.canvasManager = canvasManager;
        this.collisionDetector = collisionDetector;
    }

    // Checks if the ghost piece feature is enabled in local storage
    isGhostPieceEnabled() {
        return localStorage.getItem('ghostPieceEnabled') !== '0';
    }

    // Renders the ghost piece on the board based on the current state
    drawGhostPiece(state) {
        if (!this.isGhostPieceEnabled()) return;
        if (!this.canvasManager.getContext() || !state.piece) return;

        // Calculate the Y position where the piece would land
        let gy = state.y;
        while (!this.collisionDetector.collides(state.board, state.piece, state.x, gy + 1)) {
            gy++; // Drop the piece down until it collides
        }

        // Render each cell of the ghost piece
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const v = state.piece[y * 4 + x];
                if (v) {
                    this.drawGhostCell(state.x + x, gy + y, v);
                }
            }
        }
    }

    // Draws a single cell of the ghost piece with transparency
    drawGhostCell(x, y, v) {
        const ctx = this.canvasManager.getContext();
        const cellSize = this.canvasManager.getCellSize();

        // Use the piece color with 25% opacity (transparency)
        ctx.fillStyle = ColorManager.colorFor(v) + "25";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
    }
}