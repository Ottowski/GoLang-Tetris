import { createWS } from './ws.js';
import { initCanvas, drawState } from './game.js';
import { soundManager } from './sounds.js';
import { fetchHighscores, submitHighscore, checkHighscore } from './highscore.js';

export default function initUI() {
    
    // hookup submit button before game over modal
    setTimeout(() => {
    const submitBtn = document.getElementById('submitHighscoreBtn');
    const nameInput = document.getElementById('playerName');
    const finalScoreEl = document.getElementById('finalScore');
    
    if (!submitBtn || !nameInput || !finalScoreEl) return;
    submitBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim() || 'Anonymous';
        const scoreText = finalScoreEl.textContent || '';
        const m = scoreText.match(/(\d+)/);
        const score = m ? parseInt(m[1], 10) : 0;
        const ok = await submitHighscore(name, score);
        submitBtn.disabled = true;
        const gameOverModal = document.getElementById("gameOverModal");
        if (ok) {
            document.getElementById("highscoreModal").classList.remove("show");
            // when GameOver-modal is shown
            if (gameOverModal) {
                gameOverModal.classList.add("show");
            }
        }
        if (ok) {
            nameInput.value = '';
            submitBtn.textContent = 'Submitted';
            document.getElementById("highscoreModal").classList.remove("show");
            fetchHighscores();
            window.controlsEnabled = true;
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Score';
            }, 1500);
        } else {
            submitBtn.disabled = false;
            alert('Could not submit score. Try again.');
            window.controlsEnabled = true;
        }
    });
    }, 200);

    initCanvas('tetris', 'preview', 36);
    console.log('initUI called');


    
    // setup WebSocket connection to receive game state updates
    const mode = localStorage.getItem('gameMode') || 'beginner';
    const wsUrl =
   (location.protocol === 'https:' ? 'wss:' : 'ws:') +
    '//' + location.host + '/ws?mode=' + mode;

    let lastScore = 0;
    let wasGameOver = false;
    let lastPieceID = null;



    const socket = createWS(wsUrl, (state) => {
        // incoming snapshot from server
        drawState(state);
        
        // show/hide next preview based on settings
        const previewCanvas = document.getElementById('preview');
        if (previewCanvas) {
        previewCanvas.style.display = state.mode.nextPreview ? 'block' : 'none';}

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
            // place wasGameOver directly after sound to avoid multiple triggers
            wasGameOver = true;
            // also display final score for the submit modal
            const finalScoreEl = document.getElementById("finalScore");
            if (finalScoreEl) { finalScoreEl.textContent = "Score: " + state.score;}
            // check if score is a new highscore
            const isHighscore = checkHighscore(state.score);
            // if its not highscore, show gameover modal directly
            if (!isHighscore) {
                const modal = document.getElementById('gameOverModal');
                if (modal) modal.classList.add('show');
            }
        } else if (!state.gameOver) {
            // reset when game restarts
            wasGameOver = false;
        }
        
        // Detect if game paused or resumed
        isPaused = state.paused;
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
    let controlsEnabled = true;
    let isPaused = false;
    document.addEventListener('keydown', (ev) => {
        const tag = ev.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') {
        // allow Keyboard input when in umbit textfields
        return;}

        const highscoreModal = document.getElementById('highscoreModal');
        const gameOverModal = document.getElementById('gameOverModal');

        // block controls when in highscore or game over modal is open
        if ((highscoreModal && highscoreModal.classList.contains('show')) ||
        (gameOverModal && gameOverModal.classList.contains('show'))) {
        return; // exit directly, no message-control sends
        }


        let messageControl = null;

        // assures that no controls are sent when game is paused, except unpausing
        if (isPaused) {
        if (ev.key === 'p' || ev.key === 'P') {
            messageControl = { type: 'pause/resume' };
        } else {
            return; // blockera everything but the pause key
        }
        } else {
        
        // arrow keys
        if (ev.key === 'ArrowLeft') messageControl = { type: 'move', dir: 'left' };
        else if (ev.key === 'ArrowRight') messageControl = { type: 'move', dir: 'right' };
        else if (ev.key === 'ArrowDown') messageControl = { type: 'move', dir: 'down' };
        else if (ev.key === 'ArrowUp') messageControl = { type: 'rotate' };
        
        // WASD keys
        else if (ev.key === 'a' || ev.key === 'A') messageControl = { type: 'move', dir: 'left' };
        else if (ev.key === 'd' || ev.key === 'D') messageControl = { type: 'move', dir: 'right' };
        else if (ev.key === 's' || ev.key === 'S') messageControl = { type: 'move', dir: 'down' };
        else if (ev.key === 'w' || ev.key === 'W') messageControl = { type: 'rotate' };
        
        // space to drop
        else if (ev.code === 'Space') messageControl = { type: 'drop' };
        
        // pausing game
        else if (ev.key === 'p' || ev.key === 'P') messageControl = { type: 'pause/resume' };
        }
        // no match, return
        if (!messageControl) return;
        
        ev.preventDefault(); // only block the defaul handled keys
        if (socket.isAvailable()) socket.send(messageControl);
    });



    // restart button - setup with a small delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Setting up restart button');
        const restartBtn = document.getElementById('restartBtn');
        console.log('Restart button found:', !!restartBtn);
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
               const gameOverModal = document.getElementById('gameOverModal');
               controlsEnabled = true;  // restore controls
               const highscoreModal = document.getElementById('highscoreModal');
               if (gameOverModal) gameOverModal.classList.remove('show');
               if (highscoreModal) highscoreModal.classList.remove('show');
                wasGameOver = false;
                lastScore = 0;
                // Send restart command to server
                console.log('Socket available:', socket.isAvailable());
                const sent = socket.send({ type: 'restart' });
                console.log('Restart message sent:', sent);
            });
        }
    }, 100);
    // initial highscores load
    fetchHighscores();
}