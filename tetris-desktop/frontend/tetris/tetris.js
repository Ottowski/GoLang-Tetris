import initUI from '../src/tetris/ui.js';

// bootstrap UI when the module loads
console.log('frontend/js/tetris.js loaded');

// Try to run immediately, or wait for DOMContentLoaded
function tryInit() {
    try {
        initUI();
        console.log('UI initialized');
        
        // Attach back button listener after UI is initialized
        const goBackBtn = document.getElementById('goBackBtn');
        if (goBackBtn) {
            goBackBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        } else {
            console.warn('goBackBtn not found');
        }
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