import { createWS } from './ws.js';
import { initCanvas, drawState } from './game.js';
import { soundManager } from './sounds.js';

export default function initUI() {
    initCanvas('tetris', 'preview', 36);
    console.log('initUI called');

    const wsUrl = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/ws';
    let lastScore = 0;
    let wasGameOver = false;

    const socket = createWS(wsUrl, (state) => {
        // incoming snapshot from server
        drawState(state);

        // Detect line clear (score increased)
        if (state.score > lastScore) {
            soundManager.playLineClear();
            lastScore = state.score;
        }

        // Detect game over transition
        if (state.gameOver && !wasGameOver) {
            soundManager.playGameOver();
            wasGameOver = true;
        } else if (!state.gameOver) {
            wasGameOver = false;
        }
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

    // restart button - setup with a small delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Setting up restart button');
        const restartBtn = document.getElementById('restartBtn');
        console.log('Restart button found:', !!restartBtn);
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                console.log('Restart button clicked!');
                const modal = document.getElementById('gameOverModal');
                if (modal) {
                    console.log('Removing .show class from modal');
                    modal.classList.remove('show');
                }
                lastScore = 0;
                wasGameOver = false;
                
                // Send restart command to server
                console.log('Socket available:', socket.isAvailable());
                const sent = socket.send({ type: 'restart' });
                console.log('Restart message sent:', sent);
            });
        }
    }, 100);
}
