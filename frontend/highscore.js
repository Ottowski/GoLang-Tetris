// fetch highscores from server 
export async function fetchHighscores() {
    try {
        const res = await fetch('/highscores');
        if (!res.ok) return [];
        const hs = await res.json();
        renderHighscores(hs);
        return hs;
    } catch (e) {
        console.warn('fetchHighscores failed', e);
        return [];
    }
}

export function renderHighscores(list) {
    const el = document.getElementById('highscores-list');
    if (!el) return;
    el.innerHTML = '';
    (list || []).forEach((entry) => {
        const li = document.createElement('li');
        const when = new Date(entry.when).toLocaleDateString();
        li.textContent = `${entry.name} — ${entry.score}`;
        el.appendChild(li);
    });
}

// send highscore
export async function submitHighscore(name, score) {
    try {
        const res = await fetch('/highscores', {
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
export function checkHighscore(score) {
    const highscores = JSON.parse(localStorage.getItem("highscores")) || [];

    const qualifies =
        highscores.length < 10 ||
        score > highscores[highscores.length - 1].score;
    if (qualifies) {
        document.getElementById("highscoreModal").classList.add("show");
        return true;
    }

    return false;
}