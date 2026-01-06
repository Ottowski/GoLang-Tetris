/**
 * UIManager handles UI updates and modal management for the Tetris game.
 * Manages score display and pause modal visibility.
 */
export class UIManager {
    /**
     * Updates the score display in the UI
     * @param {number} score - The current game score
     */
    updateScore(score) {
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = score || 0;
    }

    /**
     * Shows or hides the pause modal based on game state
     * @param {boolean} paused - Whether the game is currently paused
     */
    handlePauseModal(paused) {
        const pauseModal = document.getElementById('pauseModal');
        if (paused) {
            console.log("Game paused");
            if (pauseModal) pauseModal.classList.add('show');
        } else {
            console.log("Game resumed");
            if (pauseModal) pauseModal.classList.remove('show');
        }
    }
}