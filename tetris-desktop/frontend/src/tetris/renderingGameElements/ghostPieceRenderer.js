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
        const color = ColorManager.colorFor(v);

        const px = x * cellSize;
        const py = y * cellSize;
        const size = cellSize - 2;

        // Draw outer shadow for depth (semi-transparent)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(px + 1, py + 1, size, size);

        // Draw main block background with transparency
        ctx.fillStyle = color + "30";
        ctx.fillRect(px, py, size, size);

        // Create gradient for 3D effect (semi-transparent)
        const gradient = ctx.createLinearGradient(px, py, px + size, py + size);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(px, py, size, size);

        // Draw highlight on top-left for shine effect (semi-transparent)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(px + 2, py + 2, size * 0.4, 2);
        ctx.fillRect(px + 2, py + 2, 2, size * 0.4);

        // Draw darker bottom-right edge for depth (semi-transparent)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(px + size - 3, py + 3, 3, size - 3);
        ctx.fillRect(px + 3, py + size - 3, size - 3, 3);

        // Draw border (semi-transparent)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

        // Inner border for extra detail (semi-transparent)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
    }
}