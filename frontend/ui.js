import { createWS } from './ws.js';
import { initCanvas, drawState } from './game.js';

export default function initUI() {
    initCanvas('tetris', 'preview', 36);

    const wsUrl = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/ws';
    const socket = createWS(wsUrl, (state) => {
        // incoming snapshot from server
        drawState(state);
    }, () => {
        console.log('ws open');
    }, () => {
        console.log('ws closed');
    });

    // request an initial snapshot via REST if WS not available
    async function fetchInitial() {
        if (socket.isAvailable()) return;
        try {
            const res = await fetch('/board');
            if (!res.ok) return;
            const data = await res.json();
            drawState(data);
        } catch (e) {
            // ignore
        }
    }
    fetchInitial();

    // keyboard controls
    document.addEventListener('keydown', (ev) => {
        let msg = null;
        // arrow keys
        if (ev.key === 'ArrowLeft') msg = { type: 'move', dir: 'left' };
        else if (ev.key === 'ArrowRight') msg = { type: 'move', dir: 'right' };
        else if (ev.key === 'ArrowDown') msg = { type: 'move', dir: 'down' };
        else if (ev.key === 'ArrowUp') msg = { type: 'rotate' };
        // WASD keys
        else if (ev.key === 'a' || ev.key === 'A') msg = { type: 'move', dir: 'left' };
        else if (ev.key === 'd' || ev.key === 'D') msg = { type: 'move', dir: 'right' };
        else if (ev.key === 's' || ev.key === 'S') msg = { type: 'move', dir: 'down' };
        else if (ev.key === 'w' || ev.key === 'W') msg = { type: 'rotate' };
        // space to drop
        else if (ev.code === 'Space') msg = { type: 'drop' };
        if (!msg) return;
        ev.preventDefault();
        if (socket.isAvailable()) socket.send(msg);
    });
}
