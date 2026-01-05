import { soundManager } from './sounds.js';

// Settings elements values for setting up event listeners
const tetrixToggle = document.getElementById('tetrixToggle');
const ghostToggle = document.getElementById('ghostToggle');
const soundToggle = document.getElementById('soundToggle');
const volumeSlider = document.getElementById('volumeSlider');
const goBackBtn = document.getElementById('goBackBtn');
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
const savedMode = localStorage.getItem('gameMode') || 'beginner';

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
ghostToggle.checked = saved === '1';

soundToggle.checked = soundManager.enabled;
volumeSlider.value = soundManager.getVolume();

const tetrixSaved = localStorage.getItem('tetrixEnabled');
tetrixToggle.checked = tetrixSaved !== '0';

// Save Ghostpiece setting to be toggled
ghostToggle.addEventListener('change', () => {
    localStorage.setItem(
        'ghostPieceEnabled',
        ghostToggle.checked ? '1' : '0'
    );
    console.log('Ghost saved:', ghostToggle.checked);
});

// Save Tetrix setting to be toggled
tetrixToggle.addEventListener('change', () => {
    localStorage.setItem(
        'tetrixEnabled',
        tetrixToggle.checked ? '1' : '0'
    );
});

// Toggle sound
soundToggle.addEventListener('change', () => {
    soundManager.toggle();
});

// Change volume
volumeSlider.addEventListener('input', (e) => {
    soundManager.setVolume(e.target.value);
});

// Go back
document.getElementById('goBackBtn').addEventListener('click', async () => {
    
    await fetch('/goBack', { method: 'POST' });

    // go back to mainmenu
    window.location.href = '../html/index.html';
});