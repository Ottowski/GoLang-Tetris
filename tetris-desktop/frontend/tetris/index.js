// Initialize menu buttons when DOM is ready
function initMenu() {
    const startBtn = document.getElementById('startBtn');
    const settingsBtn = document.getElementById('settingsBtn');

    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            try {
                await fetch('http://localhost:8081/start', { method: 'POST' });
            } catch (e) {
                console.warn('start fetch failed', e);
            }
            // go to game
            window.location.href = 'tetris.html';
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', async () => {
            try {
                await fetch('http://localhost:8081/settings', { method: 'POST' });
            } catch (e) {
                console.warn('settings fetch failed', e);
            }
            // go to settings
            window.location.href = 'settings.html';
        });
    }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initMenu);
} else {
    initMenu();
}

/*document.getElementById('difficultyBtn').addEventListener('click', async () => {
    
    await fetch('/difficulty', { method: 'POST' });

    // go to difficulty selection
    window.location.href = '/difficulty.html';
});*/