import { submitHighscore, fetchHighscores } from '../highscore.js';

export class ModalController {
    constructor(gameController, inputController) {
        this.gameController = gameController;
        this.inputController = inputController;
    }

    // Initialize modal event listeners
    init() {
        this.setupHighscoreSubmission();
        this.setupRestartButton();
    }

    // Setup highscore submission listener
    setupHighscoreSubmission() {
        setTimeout(() => {
            const submitBtn = document.getElementById('submitHighscoreBtn');
            const nameInput = document.getElementById('playerName');
            const finalScoreEl = document.getElementById('finalScore');
            // Ensure elements exist
            if (!submitBtn || !nameInput || !finalScoreEl) return;

            submitBtn.addEventListener('click', async () => {
                await this.handleHighscoreSubmission(submitBtn, nameInput);
            });
        }, 200);
    }

    // Handle highscore submission
    async handleHighscoreSubmission(submitBtn, nameInput) {
        const name = nameInput.value.trim() || 'Anonymous';
        const scoreText = document.getElementById('finalScore').textContent || '';
        const m = scoreText.match(/(\d+)/);
        const score = m ? parseInt(m[1], 10) : 0;

        const ok = await submitHighscore(name, score);
        submitBtn.disabled = true;

        // Handle submission result
        if (ok) {
            this.closeHighscoreModal();
            this.showGameOverModal();
            nameInput.value = '';
            submitBtn.textContent = 'Submitted';
            fetchHighscores();

            this.inputController.setControlsEnabled(true);

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Score';
            }, 1500);
        } else {
            submitBtn.disabled = false;
            alert('Could not submit score. Try again.');
            this.inputController.setControlsEnabled(true);
        }
    }
    // Setup restart button listener
    setupRestartButton() {
        setTimeout(() => {
            console.log('Setting up restart button');
            const restartBtn = document.getElementById('restartBtn');
            console.log('Restart button found:', !!restartBtn);

            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                    this.handleRestart();
                });
            }
        }, 100);
    }

    // Handle game restart
    handleRestart() {
        const gameOverModal = document.getElementById('gameOverModal');
        const highscoreModal = document.getElementById('highscoreModal');

        this.inputController.setControlsEnabled(true);

        if (gameOverModal) gameOverModal.classList.remove('show');
        if (highscoreModal) highscoreModal.classList.remove('show');

        this.gameController.restartGame();
    }

    // Close highscore modal
    closeHighscoreModal() {
        const highscoreModal = document.getElementById('highscoreModal');
        if (highscoreModal) {
            highscoreModal.classList.remove('show');
        }
    }

    // Show game over modal
    showGameOverModal() {
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) {
            gameOverModal.classList.add('show');
        }
    }

    // Check if any modal is open
    isAnyModalOpen() {
        const highscoreModal = document.getElementById('highscoreModal');
        const gameOverModal = document.getElementById('gameOverModal');

        return (highscoreModal && highscoreModal.classList.contains('show')) ||
               (gameOverModal && gameOverModal.classList.contains('show'));
    }
}