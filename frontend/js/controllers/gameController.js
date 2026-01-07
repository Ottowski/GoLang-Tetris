import { createWS } from '../ws.js';
import { initCanvas, drawState } from '../game.js';
import { soundManager } from '../sounds.js';
import { fetchHighscores, checkHighscore } from '../highscore.js';

export class GameController {
    constructor() {
        this.socket = null;
        this.lastScore = 0;
        this.wasGameOver = false;
        this.lastPieceID = null;
        this.isPaused = false;
        this.mode = localStorage.getItem('gameMode') || 'beginner';
    }

    // Initialize the game controller
    init() {
        initCanvas('tetris', 'preview', 36);
        console.log('GameController initialized');

        this.setupWebSocket();
        this.fetchInitialState();
    }
    
    // Setup WebSocket connection
    setupWebSocket() {
        const wsUrl = (location.protocol === 'https:' ? 'wss:' : 'ws:') +
            '//' + location.host + '/ws?mode=' + this.mode;

        this.socket = createWS(wsUrl, (state) => {
            this.handleGameStateUpdate(state);
        }, () => {
            console.log('ws open');
        }, () => {
            console.log('ws closed');
        });
    }

    handleGameStateUpdate(state) {
        drawState(state);

        // Show/hide next preview based on settings
        const previewCanvas = document.getElementById('preview');
        if (previewCanvas) {
            previewCanvas.style.display = state.mode.nextPreview ? 'block' : 'none';
        }

        // Detect block placement
        if (this.lastPieceID !== null && state.pieceId !== this.lastPieceID) {
            soundManager.playBlockPlace();
        }
        this.lastPieceID = state.pieceId;

        // Detect line clear
        if (state.score > this.lastScore) {
            soundManager.playLineClear();
            this.lastScore = state.score;
        }

        // Detect game over transition
        if (state.gameOver && !this.wasGameOver) {
            soundManager.playGameOver();
            this.wasGameOver = true;

            // Display final score for the submit modal
            const finalScoreEl = document.getElementById("finalScore");
            if (finalScoreEl) {
                finalScoreEl.textContent = "Score: " + state.score;
            }

            // Check if score is a new highscore
            const isHighscore = checkHighscore(state.score);
            if (!isHighscore) {
                const modal = document.getElementById('gameOverModal');
                if (modal) modal.classList.add('show');
            }
        } else if (!state.gameOver) {
            // Reset when game restarts
            this.wasGameOver = false;
        }

        // Detect if game paused or resumed
        this.isPaused = state.paused;
        if (state.paused) {
            console.log("Game paused");
        } else {
            console.log("Game resumed");
        }
    }

    //  Fetch initial game state if WebSocket is not yet available
    async fetchInitialState() {
        if (this.socket && this.socket.isAvailable()) return;
        try {
            const res = await fetch('/board');
            if (!res.ok) return;
            const data = await res.json();
            drawState(data);
        } catch (e) {
            // ignore
        }
    }

    // Send control message to server
    sendControlMessage(message) {
        if (this.socket && this.socket.isAvailable()) {
            this.socket.send(message);
        }
    }

    // Restart the game
    restartGame() {
        this.wasGameOver = false;
        this.lastScore = 0;
        this.sendControlMessage({ type: 'restart', mode: this.mode });
    }

    isGamePaused() {
        return this.isPaused;
    }

    isGameOver() {
        return this.wasGameOver;
    }
}