// Initialize menu buttons when DOM is ready
function initMenu() {
    const startBtn = document.getElementById('startBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const quitBtn = document.getElementById('quitBtn');

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

    if (quitBtn) {
        quitBtn.addEventListener('click', () => {
            window.runtime.Quit();
        });
    }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initMenu);
} else {
    initMenu();
}