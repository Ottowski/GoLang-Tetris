import { soundManager } from './sounds.js';

// Settings elements values for setting up event listeners
const ghostToggle = document.getElementById('ghostToggle');
const soundToggle = document.getElementById('soundToggle');
const volumeSlider = document.getElementById('volumeSlider');


const goBackBtn = document.getElementById('goBackBtn');

// Load current values
const saved = localStorage.getItem('ghostPieceEnabled');
ghostToggle.checked = saved === '1';
soundToggle.checked = soundManager.enabled;
volumeSlider.value = soundManager.getVolume();

// Save Ghost piece setting and to be Toggled
ghostToggle.addEventListener('change', () => {
    localStorage.setItem(
        'ghostPieceEnabled',
        ghostToggle.checked ? '1' : '0'
    );
    console.log('Ghost saved:', ghostToggle.checked);
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