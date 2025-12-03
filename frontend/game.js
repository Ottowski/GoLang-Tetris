// Rendering and game drawing utilities (ES module)
let canvas, ctx, previewCanvas, previewCtx;
export let cellSize = 40;

export function initCanvas(mainId = 'tetris', previewId = 'preview', size = 40) {
    cellSize = size;
    canvas = document.getElementById(mainId);
    ctx = canvas.getContext('2d');
    canvas.width = colsToPixels(10);
    canvas.height = rowsToPixels(20);
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';

    previewCanvas = document.getElementById(previewId);
    if (previewCanvas) previewCtx = previewCanvas.getContext('2d');
}

function colsToPixels(c) { return c * cellSize }
function rowsToPixels(r) { return r * cellSize }

export function drawState(state) {
    if (!ctx) return;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw board
    for (let y = 0; y < state.board.length; y++) {
        for (let x = 0; x < state.board[y].length; x++) {
            const v = state.board[y][x];
            if (v !== 0) drawCell(x, y, colorFor(v));
        }
    }

    // overlay falling piece
    const piece = state.piece || [];
    const px = state.x || 0;
    const py = state.y || 0;
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const v = piece[y * 4 + x];
            if (v !== 0) drawCell(px + x, py + y, colorFor(v));
        }
    }

    // draw preview (next piece)
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
        default: return '#fff';
    }
}

function drawPreview(flatPiece) {
    // clear
    previewCtx.fillStyle = 'black';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    const cell = Math.floor(previewCanvas.width / 4);
    const startX = Math.floor((previewCanvas.width - (cell * 4)) / 2);
    const startY = Math.floor((previewCanvas.height - (cell * 4)) / 2);
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const v = flatPiece[y * 4 + x];
            if (v !== 0) {
                previewCtx.fillStyle = colorFor(v);
                previewCtx.fillRect(startX + x * cell, startY + y * cell, cell - 1, cell - 1);
            }
        }
    }
}
