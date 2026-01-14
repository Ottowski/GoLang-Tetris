import { ColorManager } from './colorManager.js';

// Renders the next piece in the preview canvas
export class PreviewRenderer {
    // Initializes the PreviewRenderer with a reference to the CanvasManager
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
    }

    // Renders the given piece in the preview canvas
    drawPreview(flatPiece) {
        const previewCtx = this.canvasManager.getPreviewContext();
        const previewCanvas = this.canvasManager.getPreviewCanvas();

        if (!previewCtx || !flatPiece || !previewCanvas) return;

        // Clear the preview canvas
        previewCtx.fillStyle = '#000';
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

        // Calculate cell size for the preview (smaller than main board)
        const cell = Math.floor(previewCanvas.width / 4);

        // Center the piece in the preview canvas
        const startX = Math.floor((previewCanvas.width - (cell * 4)) / 2);
        const startY = Math.floor((previewCanvas.height - (cell * 4)) / 2);

        // Render each cell of the piece
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const v = flatPiece[y * 4 + x];
                if (v) {
                    this.drawPreviewCell(previewCtx, startX + x * cell, startY + y * cell, cell, ColorManager.colorFor(v));
                }
            }
        }
    }

    // Draws a single preview cell with enhanced 3D graphics
    drawPreviewCell(ctx, px, py, cellSize, color) {
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