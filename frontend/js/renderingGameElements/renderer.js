import { ColorManager } from './colorManager.js';

/**
 * Renderer is the main rendering orchestrator for the Tetris game.
 * Coordinates all rendering components to draw the complete game state.
 */
export class Renderer {
    /**
     * Creates a new Renderer instance
     * @param {CanvasManager} canvasManager - Manages canvas operations
     * @param {GhostPieceRenderer} ghostPieceRenderer - Handles ghost piece rendering
     * @param {PreviewRenderer} previewRenderer - Handles next piece preview
     * @param {UIManager} uiManager - Handles UI updates
     */
    constructor(canvasManager, ghostPieceRenderer, previewRenderer, uiManager) {
        this.canvasManager = canvasManager;
        this.ghostPieceRenderer = ghostPieceRenderer;
        this.previewRenderer = previewRenderer;
        this.uiManager = uiManager;
    }

    /**
     * Renders the complete game state including board, pieces, ghost piece, and UI
     * @param {Object} state - The current game state from the server
     */
    drawState(state) {
        if (!state) return;
        if (!this.canvasManager.getContext()) return;

        // Clear the canvas for fresh rendering
        this.canvasManager.clear();

        // Render ghost piece if enabled in game mode
        if (state.mode.ghostPiece) {
            this.ghostPieceRenderer.drawGhostPiece(state);
        }

        // Render the game board (placed pieces)
        if (Array.isArray(state.board)) {
            for (let y = 0; y < state.board.length; y++) {
                for (let x = 0; x < state.board[y].length; x++) {
                    const v = state.board[y][x];
                    if (v) this.drawCell(x, y, ColorManager.colorFor(v));
                }
            }
        }

        // Render the currently falling piece
        const piece = state.piece || [];
        const px = Number.isFinite(state.x) ? state.x : 0;
        const py = Number.isFinite(state.y) ? state.y : 0;
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const v = piece[y * 4 + x];
                if (v) this.drawCell(px + x, py + y, ColorManager.colorFor(v));
            }
        }

        // Render next piece preview if enabled
        if (state.mode.nextPreview && state.next && state.next.length > 0) {
            this.previewRenderer.drawPreview(state.next[0]);
        }

        // Update UI elements
        this.uiManager.updateScore(state.score);
        this.uiManager.handlePauseModal(state.paused);
    }

    /**
     * Draws a single cell on the main game canvas
     * @param {number} x - X coordinate on the board
     * @param {number} y - Y coordinate on the board
     * @param {string} color - Hex color code for the cell
     */
    drawCell(x, y, color) {
        const ctx = this.canvasManager.getContext();
        const cellSize = this.canvasManager.getCellSize();
        if (!ctx) return;
        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
    }
}