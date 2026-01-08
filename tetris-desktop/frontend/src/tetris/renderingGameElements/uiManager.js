// Manages UI elements like score display and pause modal
export class UIManager {
    // Updates the score display element
    updateScore(score) {
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = score || 0;
    }

    // Handles showing or hiding the pause modal based on game state
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