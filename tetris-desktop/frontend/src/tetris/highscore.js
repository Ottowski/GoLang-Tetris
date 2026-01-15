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
        const li = document.createElement('li');
        li.textContent = 'No highscores yet!';
        li.style.color = '#888';
        el.appendChild(li);
        return;
    }
    (list || []).forEach((entry, index) => {
        const li = document.createElement('li');
        const when = new Date(entry.when).toLocaleDateString();
        li.textContent = `${index + 1}. ${entry.name} — ${entry.score}`;
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