const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

const cellSize = 40;
canvas.width = colsToPixels(10);
canvas.height = rowsToPixels(20);
// Ensure CSS size matches canvas drawing size (prevents browser scaling)
canvas.style.width = canvas.width + 'px';
canvas.style.height = canvas.height + 'px';

function colsToPixels(c) { return c * cellSize }
function rowsToPixels(r) { return r * cellSize }

const wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
let ws = null;
let wsAvailable = false;
let latestState = null;

function startWebSocket() {
    try {
        ws = new WebSocket(wsUrl);
    } catch (e) {
        console.warn('ws ctor failed', e);
        ws = null;
        wsAvailable = false;
        return;
    }

    ws.addEventListener('open', () => {
        console.log('ws open');
        wsAvailable = true;
    });

    ws.addEventListener('message', (evt) => {
        try {
            const state = JSON.parse(evt.data);
            latestState = state;
            drawState(state);
        } catch (e) {
            console.error('invalid message', e);
        }
    });

    ws.addEventListener('close', () => {
        console.log('ws closed');
        wsAvailable = false;
        // try reconnect after a short delay
        setTimeout(startWebSocket, 1000);
    });

    ws.addEventListener('error', (err) => {
        console.error('ws error', err);
        wsAvailable = false;
        try { ws.close(); } catch {}
    });
}

startWebSocket();

// If WS isn't available, poll the REST endpoint for board state
let pollInterval = setInterval(async () => {
    if (wsAvailable) return;
    try {
        const res = await fetch('/board');
        if (!res.ok) return;
        const data = await res.json();
        latestState = data;
        drawState(data);
    } catch (e) {
        // ignore fetch errors
    }
}, 300);

function drawState(state) {
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
}

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
}

function colorFor(v) {
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

document.addEventListener('keydown', (ev) => {
    if (!wsAvailable) {
        // fallback to REST move endpoint if websocket isn't available
        let dir = null;
        if (ev.key === 'ArrowLeft') dir = 'left';
        else if (ev.key === 'ArrowRight') dir = 'right';
        else if (ev.key === 'ArrowDown') dir = 'down';
        else if (ev.key === 'ArrowUp') dir = 'rotate';
        else if (ev.code === 'Space') dir = 'drop';
        if (dir) {
            ev.preventDefault();
            fetch('/move', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ direction: dir }) }).catch(()=>{});
        }
        return;
    }
    let msg = null;
    if (ev.key === 'ArrowLeft') msg = { type: 'move', dir: 'left' };
    else if (ev.key === 'ArrowRight') msg = { type: 'move', dir: 'right' };
    else if (ev.key === 'ArrowDown') msg = { type: 'move', dir: 'down' };
    else if (ev.key === 'ArrowUp') msg = { type: 'rotate' };
    else if (ev.code === 'Space') msg = { type: 'drop' };
    if (msg) {
        // prevent the browser from scrolling the page when arrows/space are pressed
        ev.preventDefault();
        ws.send(JSON.stringify(msg));
    }
});
