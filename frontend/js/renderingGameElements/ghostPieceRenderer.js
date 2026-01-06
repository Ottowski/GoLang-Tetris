import { ColorManager } from './colorManager.js';

/**
 * GhostPieceRenderer handles the rendering of ghost pieces (preview of where
 * the current piece will land). Ghost pieces help players position pieces more accurately.
 */
export class GhostPieceRenderer {
    /**
     * Creates a new GhostPieceRenderer instance
     * @param {CanvasManager} canvasManager - The canvas manager for rendering context
     * @param {CollisionDetector} collisionDetector - The collision detector for finding landing position
     */
    constructor(canvasManager, collisionDetector) {
        this.canvasManager = canvasManager;
        this.collisionDetector = collisionDetector;
    }

    /**
     * Checks if ghost piece rendering is enabled in localStorage
     * @returns {boolean} True if ghost pieces should be rendered
     */
    isGhostPieceEnabled() {
        return localStorage.getItem('ghostPieceEnabled') !== '0';
    }

    /**
     * Renders the ghost piece at the position where the current piece would land
     * @param {Object} state - The current game state
     */
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

    /**
     * Draws a single ghost cell with transparency
     * @param {number} x - X coordinate on the board
     * @param {number} y - Y coordinate on the board
     * @param {number} v - Piece type value for color
     */
    drawGhostCell(x, y, v) {
        const ctx = this.canvasManager.getContext();
        const cellSize = this.canvasManager.getCellSize();

        // Use the piece color with 25% opacity (transparency)
        ctx.fillStyle = ColorManager.colorFor(v) + "25";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
    }
}