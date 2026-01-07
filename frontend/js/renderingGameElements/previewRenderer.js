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
                    previewCtx.fillStyle = ColorManager.colorFor(v);
                    previewCtx.fillRect(startX + x * cell, startY + y * cell, cell - 1, cell - 1);
                }
            }
        }
    }
}