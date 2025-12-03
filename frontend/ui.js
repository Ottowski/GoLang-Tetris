import { createWS } from './ws.js';
import { initCanvas, drawState, cellSize } from './game.js';

export default function initUI() {
    initCanvas('tetris', 'preview', 40);

    const wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
    const socket = createWS(wsUrl, (state) => {
        drawState(state);
    }, () => {
        console.log('ws open');
    }, () => {
        console.log('ws closed');
    });

    // poll REST /board when websocket isn't available
    setInterval(async () => {
        if (socket.isAvailable()) return;
        try {
            const res = await fetch('/board');
            if (!res.ok) return;
            const data = await res.json();
            drawState(data);
        } catch (e) {}
    }, 300);

    document.addEventListener('keydown', (ev) => {
        let handled = false;
        let msg = null;
        if (ev.key === 'ArrowLeft') { msg = { type: 'move', dir: 'left' }; handled = true }
        else if (ev.key === 'ArrowRight') { msg = { type: 'move', dir: 'right' }; handled = true }
        else if (ev.key === 'ArrowDown') { msg = { type: 'move', dir: 'down' }; handled = true }
        else if (ev.key === 'ArrowUp') { msg = { type: 'rotate' }; handled = true }
        else if (ev.code === 'Space') { msg = { type: 'drop' }; handled = true }

        if (!handled) return;
        ev.preventDefault();
        if (socket.isAvailable()) {
            socket.send(msg);
        } else {
            // REST fallback
            let dir = msg.type === 'move' ? msg.dir : (msg.type === 'rotate' ? 'rotate' : (msg.type === 'drop' ? 'drop' : null));
            if (dir) fetch('/move', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ direction: dir }) }).catch(()=>{});
            if (msg.type === 'rotate') fetch('/move', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ direction: 'rotate' }) }).catch(()=>{});
            if (msg.type === 'drop') fetch('/move', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ direction: 'drop' }) }).catch(()=>{});
        }
    });
}
