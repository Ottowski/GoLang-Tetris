document.getElementById('startBtn').addEventListener('click', async () => {
    
    await fetch('/start', { method: 'POST' });

    // gå till spelet
    window.location.href = '/tetris.html';
});
