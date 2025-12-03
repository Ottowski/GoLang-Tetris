import initUI from './ui.js';

// bootstrap UI when the module loads
console.log('frontend/app.js loaded');
window.addEventListener('DOMContentLoaded', () => {
    try {
        initUI();
    } catch (e) {
        console.error('failed to initialize UI', e);
    }
});
