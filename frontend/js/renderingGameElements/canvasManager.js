// Manages the main and preview canvases for the Tetris game
export class CanvasManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.previewCanvas = null;
        this.previewCtx = null;
        this.cellSize = 36; // Size of each cell in pixels
        this.COLS = 10; // Number of columns in the game board
        this.ROWS = 20; // Number of rows in the game board
    }

    // Initializes the main and preview canvases
    initCanvas(mainId = 'tetris', previewId = 'preview', size = 36) {
        this.cellSize = size;
        this.canvas = document.getElementById(mainId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.COLS * this.cellSize;
        this.canvas.height = this.ROWS * this.cellSize;
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';

        this.previewCanvas = document.getElementById(previewId);
        if (this.previewCanvas) this.previewCtx = this.previewCanvas.getContext('2d');
    }

    // Clears the main canvas by filling it with black
    clear() {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Gets the size of each cell
    getCellSize() {
        return this.cellSize;
    }

    // Gets the 2D rendering context for the main canvas
    getContext() {
        return this.ctx;
    }

    // Gets the 2D rendering context for the preview canvas
    getPreviewContext() {
        return this.previewCtx;
    }

    // Gets the main canvas element
    getCanvas() {
        return this.canvas;
    }

    // Gets the preview canvas element
    getPreviewCanvas() {
        return this.previewCanvas;
    }
}