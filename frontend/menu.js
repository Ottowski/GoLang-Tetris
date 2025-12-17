document.getElementById('startBtn').addEventListener('click', async () => {
    
    await fetch('/start', { method: 'POST' });

    // go to game
    window.location.href = '/tetris.html';
});
