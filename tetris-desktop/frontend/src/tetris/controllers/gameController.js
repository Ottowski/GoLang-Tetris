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
        console.log('[GameController] init() called');
        initCanvas('tetris', 'preview', 36);
        console.log('[GameController] Canvas initialized');

        this.setupWebSocket();
        this.fetchInitialState();
        console.log('[GameController] WebSocket setup and initial state fetch initiated');
    }
    
    // Setup WebSocket connection
    setupWebSocket() {
        // In Wails, we need to connect to the backend on localhost:8081
        const wsUrl = 'ws://localhost:8081/ws?mode=' + this.mode;
        console.log('[GameController] Setting up WebSocket with URL:', wsUrl);

        this.socket = createWS(wsUrl, (state) => {
            console.log('[GameController] Game state received');
            this.handleGameStateUpdate(state);
        }, () => {
            console.log('[GameController] WebSocket opened');
        }, () => {
            console.log('[GameController] WebSocket closed');
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

            // Check if score is a new highscore (async now)
            checkHighscore(state.score).then(isHighscore => {
                if (!isHighscore) {
                    const modal = document.getElementById('gameOverModal');
                    if (modal) modal.classList.add('show');
                }
            });
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
        console.log('[GameController] Fetching initial state...');
        if (this.socket && this.socket.isAvailable()) {
            console.log('[GameController] WebSocket is available, skipping HTTP fetch');
            return;
        }
        try {
            console.log('[GameController] Calling http://localhost:8081/board');
            const res = await fetch('http://localhost:8081/board');
            console.log('[GameController] Response status:', res.status);
            if (!res.ok) {
                console.warn('[GameController] Board endpoint returned status:', res.status);
                return;
            }
            const data = await res.json();
            console.log('[GameController] Initial state received:', data);
            drawState(data);
        } catch (e) {
            console.warn('[GameController] fetchInitialState failed:', e);
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