import { ColorManager } from './colorManager.js';

/**
 * PreviewRenderer handles the rendering of the next piece preview.
 * Shows players what piece will come next to help with planning.
 */
export class PreviewRenderer {
    /**
     * Creates a new PreviewRenderer instance
     * @param {CanvasManager} canvasManager - The canvas manager for the preview canvas
     */
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
    }

    /**
     * Renders the next piece in the preview canvas
     * @param {number[]} flatPiece - The next piece as a flat 16-element array
     */
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