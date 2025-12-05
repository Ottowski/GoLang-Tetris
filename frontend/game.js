// Rendering and game drawing utilities (ES module) — simplified and robust
let canvas, ctx, previewCanvas, previewCtx;
export let cellSize = 36;
const COLS = 10;
const ROWS = 20;

export function initCanvas(mainId = 'tetris', previewId = 'preview', size = 36) {
    cellSize = size;
    canvas = document.getElementById(mainId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.width = COLS * cellSize;
    canvas.height = ROWS * cellSize;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';

    previewCanvas = document.getElementById(previewId);
    if (previewCanvas) previewCtx = previewCanvas.getContext('2d');
}

export function clear() {
    if (!ctx) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawState(state) {
    if (!state) return;
    if (!ctx) return;
    clear();

    // draw board
    if (Array.isArray(state.board)) {
        for (let y = 0; y < state.board.length; y++) {
            for (let x = 0; x < state.board[y].length; x++) {
                const v = state.board[y][x];
                if (v) drawCell(x, y, colorFor(v));
            }
        }
    }

    // overlay falling piece
    const piece = state.piece || [];
    const px = Number.isFinite(state.x) ? state.x : 0;
    const py = Number.isFinite(state.y) ? state.y : 0;
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const v = piece[y * 4 + x];
            if (v) drawCell(px + x, py + y, colorFor(v));
        }
    }

    // preview
    if (state.next && state.next.length > 0 && previewCtx) drawPreview(state.next[0]);
}

export function drawCell(x, y, color) {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
}

export function colorFor(v) {
    switch (v) {
        case 1: return '#00f0f0';
        case 2: return '#f0f000';
        case 3: return '#a000f0';
        case 4: return '#00f000';
        case 5: return '#f00000';
        case 6: return '#0000f0';
        case 7: return '#f08000';
        case 8: return '#ff69b4';
        case 9: return '#ffd700';
        default: return '#666';
    }
}

function drawPreview(flatPiece) {
    if (!previewCtx || !flatPiece) return;
    previewCtx.fillStyle = '#000';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    const cell = Math.floor(previewCanvas.width / 4);
    const startX = Math.floor((previewCanvas.width - (cell * 4)) / 2);
    const startY = Math.floor((previewCanvas.height - (cell * 4)) / 2);
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const v = flatPiece[y * 4 + x];
            if (v) {
                previewCtx.fillStyle = colorFor(v);
                previewCtx.fillRect(startX + x * cell, startY + y * cell, cell - 1, cell - 1);
            }
        }
    }
}
