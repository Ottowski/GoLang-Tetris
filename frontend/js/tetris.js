import initUI from './ui.js';

// bootstrap UI when the module loads
console.log('frontend/js/tetris.js loaded');

// Try to run immediately, or wait for DOMContentLoaded
function tryInit() {
    try {
        initUI();
        console.log('UI initialized');
    } catch (e) {
        console.error('failed to initialize UI', e);
    }
}

// If DOM is already loaded, run immediately
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', tryInit);
} else {
    tryInit();
}

document.getElementById('goBackBtn').addEventListener('click', async () => {
    
    await fetch('/goBack', { method: 'POST' });

    // go back to mainmenu
    window.location.href = '/html/index.html';
});

