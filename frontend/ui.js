import { createWS } from './ws.js';
import { initCanvas, drawState, fetchHighscores, submitHighscore  } from './game.js';
import { soundManager } from './sounds.js';

export default function initUI() {
    initCanvas('tetris', 'preview', 36);
    console.log('initUI called');

    const wsUrl = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/ws';
    let lastScore = 0;
    let wasGameOver = false;
    let lastPieceID = null;

    const socket = createWS(wsUrl, (state) => {
        // incoming snapshot from server
        drawState(state);

        // Detect block placement (piece changed, meaning last piece locked)
        if (lastPieceID !== null && state.pieceId !== lastPieceID) {
            soundManager.playBlockPlace();
        }
        lastPieceID = state.pieceId;

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
        if (state.paused) {
            console.log("Game paused");
        } else {
            console.log("Game resumed");
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
        // pausing game
        else if (ev.key === 'p' || ev.key === 'P') msg = { type: 'pause/resume' };
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

    // initial highscores load
fetchHighscores();

// hookup submit button in game over modal
setTimeout(() => {
    const submitBtn = document.getElementById('submitHighscoreBtn');
    const nameInput = document.getElementById('playerName');
    const finalScoreEl = document.getElementById('finalScore');

    submitBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim() || "Anonymous";
    const score = parseInt(finalScoreEl.textContent.match(/\d+/)[0]);

    const ok = await submitHighscore(name, score);
    if (ok) {
        document.getElementById("highscoreModal").classList.remove("show");
        fetchHighscores();
    }
});

    if (submitBtn && nameInput && finalScoreEl) {
        submitBtn.addEventListener('click', async () => {
            const name = nameInput.value.trim() || 'Anonymous';
            const scoreText = finalScoreEl.textContent || '';
            // assuming finalScore text is "Score: X"
            const m = scoreText.match(/(\d+)/);
            const score = m ? parseInt(m[1], 10) : 0;
            submitBtn.disabled = true;
            const ok = await submitHighscore(name, score);
            if (ok) {
                nameInput.value = '';
                // valfritt: disable knappen eller visa tack
                submitBtn.textContent = 'Submitted';
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Score';
                }, 1500);
            } else {
                submitBtn.disabled = false;
                alert('Could not submit score. Try again.');
            }
        });
    }
}, 200);

}
