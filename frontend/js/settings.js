import { soundManager } from './sounds.js';

const soundToggle = document.getElementById('soundToggle');
const volumeSlider = document.getElementById('volumeSlider');
const goBackBtn = document.getElementById('goBackBtn');

// Load current values
soundToggle.checked = soundManager.enabled;
volumeSlider.value = soundManager.getVolume();

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