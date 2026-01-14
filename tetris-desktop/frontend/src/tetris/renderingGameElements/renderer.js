import { ColorManager } from './colorManager.js';

// Renders the main game elements on the Tetris board
export class Renderer {
    // Initializes the Renderer with references to other rendering components
    constructor(canvasManager, ghostPieceRenderer, previewRenderer, uiManager) {
        this.canvasManager = canvasManager;
        this.ghostPieceRenderer = ghostPieceRenderer;
        this.previewRenderer = previewRenderer;
        this.uiManager = uiManager;
    }

    // Draws the entire game state onto the canvas
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

    // Draws a single cell at the specified board coordinates with the given color
    drawCell(x, y, color) {
        const ctx = this.canvasManager.getContext();
        const cellSize = this.canvasManager.getCellSize();
        if (!ctx) return;

        const px = x * cellSize;
        const py = y * cellSize;
        const size = cellSize - 2;

        // Draw outer shadow for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(px + 1, py + 1, size, size);

        // Draw main block background
        ctx.fillStyle = color;
        ctx.fillRect(px, py, size, size);

        // Create gradient for 3D effect
        const gradient = ctx.createLinearGradient(px, py, px + size, py + size);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(px, py, size, size);

        // Draw highlight on top-left for shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(px + 2, py + 2, size * 0.4, 2);
        ctx.fillRect(px + 2, py + 2, 2, size * 0.4);

        // Draw darker bottom-right edge for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(px + size - 3, py + 3, 3, size - 3);
        ctx.fillRect(px + 3, py + size - 3, size - 3, 3);

        // Draw border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

        // Inner border for extra detail
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
    }
}