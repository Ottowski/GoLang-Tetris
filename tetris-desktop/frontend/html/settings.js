import { soundManager } from '../src/tetris/sounds.js';

// Initialize settings only when DOM is ready
function initSettings() {
    // Settings elements values for setting up event listeners
    const tetrixToggle = document.getElementById('tetrixToggle');
    const ghostToggle = document.getElementById('ghostToggle');
    const soundToggle = document.getElementById('soundToggle');
    const volumeSlider = document.getElementById('volumeSlider');
    const goBackBtn = document.getElementById('goBackBtn');
    const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
    const savedMode = localStorage.getItem('gameMode') || 'beginner';

    // Set the initial checked state based on saved mode
    difficultyRadios.forEach(radio => {
      if (radio.value === savedMode) {
        radio.checked = true;
      }
    });

    // Set radio based on saved mode
    difficultyRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const selectedMode = radio.value;
        localStorage.setItem('gameMode', selectedMode);
        console.log('Game mode set to:', selectedMode);

        // Notify game of mode change if WebSocket is available
        if (window.gameSocket && window.gameSocket.isAvailable()) {
            window.gameSocket.send({ type: 'restart', mode: selectedMode });
        }
      });
    });

    // Load current values
    const saved = localStorage.getItem('ghostPieceEnabled');
    if (ghostToggle) ghostToggle.checked = saved === '1';

    if (soundToggle) soundToggle.checked = soundManager.enabled;
    if (volumeSlider) volumeSlider.value = soundManager.getVolume();

    const tetrixSaved = localStorage.getItem('tetrixEnabled');
    if (tetrixToggle) tetrixToggle.checked = tetrixSaved !== '0';

    // Save Ghostpiece setting to be toggled
    if (ghostToggle) {
        ghostToggle.addEventListener('change', () => {
            localStorage.setItem(
                'ghostPieceEnabled',
                ghostToggle.checked ? '1' : '0'
            );
            console.log('Ghost saved:', ghostToggle.checked);
        });
    }

    // Save Tetrix setting to be toggled
    if (tetrixToggle) {
        tetrixToggle.addEventListener('change', () => {
            localStorage.setItem(
                'tetrixEnabled',
                tetrixToggle.checked ? '1' : '0'
            );
        });
    }

    // Toggle sound
    if (soundToggle) {
        soundToggle.addEventListener('change', () => {
            soundManager.toggle();
        });
    }

    // Change volume
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            soundManager.setVolume(e.target.value);
        });
    }

    // Go back
    if (goBackBtn) {
        goBackBtn.addEventListener('click', () => {
            // go back to mainmenu
            window.location.href = 'index.html';
        });
    }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initSettings);
} else {
    initSettings();
}