document.getElementById('startBtn').addEventListener('click', async () => {
    
    await fetch('/start', { method: 'POST' });

    // go to game
    window.location.href = '/html/tetris.html';
});


/*document.getElementById('difficultyBtn').addEventListener('click', async () => {
    
    await fetch('/difficulty', { method: 'POST' });

    // go to difficulty selection
    window.location.href = '/difficulty.html';
});
document.getElementById('settingsBtn').addEventListener('click', async () => {
    
    await fetch('/settings', { method: 'POST' });

    // go to difficulty selection
    window.location.href = '/settings.html';
});*/
