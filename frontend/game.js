// Rendering and game drawing utilities (ES module) — simplified and robust
let canvas, ctx, previewCanvas, previewCtx;
export let cellSize = 36;
const COLS = 10;
const ROWS = 20;

// initialize canvases
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

// clear the main canvas
export function clear() {
    if (!ctx) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}


// Ghost piece rendering
function drawGhostPiece(state) {
    if (!ctx || !state.piece) return;

    // ghost Y-position
    let gy = state.y;
    while (!collides(state.board, state.piece, state.x, gy + 1)) {
        gy++;
    }

    // draw ghost block
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const v = state.piece[y * 4 + x];
            if (v) {
                drawGhostCell(state.x + x, gy + y, v);
            }
        }
    }
}
// draw a ghost cell
function drawGhostCell(x, y, v) {
    ctx.fillStyle = colorFor(v) + "25"; // how trasparent %
    ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
}

// helper to check collisions
function collides(board, piece, px, py) {
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const val = piece[y * 4 + x];
            if (val === 0) continue;
            const bx = px + x;
            const by = py + y;
            if (bx < 0 || bx >= COLS || by < 0 || by >= ROWS) return true;
            if (board[by][bx] !== 0) return true;
        }
    }
    return false;
}


// Main drawing function
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
    drawGhostPiece(state);
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
    
    // update score display
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = state.score || 0;

    // handle game over modal
    const modal = document.getElementById('gameOverModal');
    if (modal) {
        console.log('Game state - gameOver:', state.gameOver, 'score:', state.score);
        if (state.gameOver) {
            console.log('Game Over triggered!');
            const finalScoreEl = document.getElementById('finalScore');
            if (finalScoreEl) finalScoreEl.textContent = `Score: ${state.score || 0}`;
            modal.classList.add('show');
        } else {
            modal.classList.remove('show');
        }
    }
    // in my addition, handle pause modal
    const pauseModal = document.getElementById('pauseModal');
    if (state.paused) {
    console.log("Game paused");
    if (pauseModal) pauseModal.classList.add('show');} 
    else {
    console.log("Game resumed");
    if (pauseModal) pauseModal.classList.remove('show');}

}

// draw a single cell
export function drawCell(x, y, color) {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
}

// color mapping
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
        case 10: return '#ff4500';   
        case 11: return '#ffffffff';   
        case 12: return '#720e6aff';   
        default: return '#666';       
    }
}


// Preview drawing
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
