// fetch highscores from server 
export async function fetchHighscores() {
    try {
        const res = await fetch('http://localhost:8081/highscores');
        if (!res.ok) return [];
        const hs = await res.json();
        renderHighscores(hs);
        return hs;
    } catch (e) {
        console.warn('fetchHighscores failed', e);
        return [];
    }
}

// render highscores to DOM
export function renderHighscores(list) {
    const el = document.getElementById('highscores-list');
    if (!el) return;
    el.innerHTML = '';
    if (!list || list.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'highscore-empty';
        emptyMsg.textContent = 'No highscores yet. Be the first!';
        el.appendChild(emptyMsg);
        return;
    }
    (list || []).forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'highscore-entry';
        
        // Add ranking badge for top 3
        const rankBadge = document.createElement('span');
        rankBadge.className = 'rank-badge';
        if (index === 0) {
            rankBadge.classList.add('rank-gold');
            rankBadge.textContent = '🥇';
        } else if (index === 1) {
            rankBadge.classList.add('rank-silver');
            rankBadge.textContent = '🥈';
        } else if (index === 2) {
            rankBadge.classList.add('rank-bronze');
            rankBadge.textContent = '🥉';
        } else {
            rankBadge.textContent = `${index + 1}.`;
        }
        
        // Create entry content
        const entryContent = document.createElement('div');
        entryContent.className = 'entry-content';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'entry-name';
        nameSpan.textContent = entry.name;
        
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'entry-score';
        scoreSpan.textContent = entry.score.toLocaleString();
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'entry-date';
        const when = new Date(entry.when).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        dateSpan.textContent = when;
        
        entryContent.appendChild(nameSpan);
        entryContent.appendChild(scoreSpan);
        entryContent.appendChild(dateSpan);
        
        li.appendChild(rankBadge);
        li.appendChild(entryContent);
        el.appendChild(li);
    });
}

// send highscore
export async function submitHighscore(name, score) {
    try {
        const res = await fetch('http://localhost:8081/highscores', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name, score })
        });
        if (!res.ok) throw new Error('failed');
        await fetchHighscores(); // update list
        return true;
    } catch (e) {
        console.warn('submitHighscore failed', e);
        return false;
    }
}

// check if score qualifies as highscore
export async function checkHighscore(score) {
    try {
        const res = await fetch('http://localhost:8081/highscores');
        if (!res.ok) return false;
        const highscores = await res.json();

        const qualifies =
            highscores.length < 10 ||
            score > highscores[highscores.length - 1].score;
        if (qualifies) {
            document.getElementById("highscoreModal").classList.add("show");
            return true;
        }
        return false;
    } catch (e) {
        console.warn('checkHighscore failed:', e);
        return false;
    }
}