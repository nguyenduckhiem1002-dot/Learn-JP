let srsData = ALL_CARDS.map(() => ({ rating: null, state: 'new', ease: 2.5, interval: 0, reps: 0 }));
let filteredMap = [];
let queue = [];
let queuePos = 0;
let isFlipped = false;
let sessionStats = { again: 0, hard: 0, good: 0, easy: 0 };

function nextInterval(srs, rating) {
    if (srs.reps === 0) {
        if (rating === 'again') return 1;
        if (rating === 'hard') return 6;
        if (rating === 'good') return 10;
        if (rating === 'easy') return 4 * 1440;
    }
    const base = srs.interval || 1440;
    if (rating === 'again') return 10;
    if (rating === 'hard') return base * 1.2;
    if (rating === 'good') return base * srs.ease;
    if (rating === 'easy') return base * srs.ease * 1.3;
}
function fmtInterval(min) {
    if (min < 2) return '<1m';
    if (min < 1440) return Math.round(min) + 'm';
    return Math.round(min / 1440) + 'd';
}
function applyRating(allIdx, rating) {
    const s = srsData[allIdx];
    s.rating = rating;
    s.interval = nextInterval(s, rating);
    s.reps++;
    if (rating === 'again') { s.state = 'learn'; s.ease = Math.max(1.3, s.ease - 0.2); }
    if (rating === 'hard') { s.state = 'learn'; s.ease = Math.max(1.3, s.ease - 0.15); }
    if (rating === 'good') { s.state = 'review'; }
    if (rating === 'easy') { s.state = 'review'; s.ease += 0.15; }
}

function initFiltered(type) {
    filteredMap = [];
    ALL_CARDS.forEach((c, i) => { if (type === 'all' || c.t === type) filteredMap.push(i); });
}
function buildQueue() { queue = filteredMap.map((_, i) => i); queuePos = 0; }

function setFilter(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('categoryLabel').textContent = type === 'all' ? 'Tất cả' : type;
    initFiltered(type); buildQueue();
    sessionStats = { again: 0, hard: 0, good: 0, easy: 0 };
    document.getElementById('sessionDone').classList.remove('visible');
    showCard(true); buildMiniGrid(); updateStats();
}

function showCard(animate) {
    const scene = document.getElementById('cardScene');
    const anki = document.getElementById('ankiArea');
    const done = document.getElementById('sessionDone');
    if (queuePos >= queue.length) {
        scene.style.visibility = 'hidden'; anki.style.display = 'none';
        done.classList.add('visible');
        ['again', 'hard', 'good', 'easy'].forEach(r => document.getElementById('done' + r.charAt(0).toUpperCase() + r.slice(1)).textContent = sessionStats[r]);
        return;
    }
    scene.style.visibility = ''; anki.style.display = ''; done.classList.remove('visible');
    const fIdx = queue[queuePos], allIdx = filteredMap[fIdx];
    const c = ALL_CARDS[allIdx], srs = srsData[allIdx];

    isFlipped = false;
    const card = document.getElementById('mainCard');
    card.style.transition = 'none'; card.classList.remove('flipped');
    void card.offsetWidth; card.style.transition = '';

    if (animate) {
        const slide = document.getElementById('cardSlide');
        slide.classList.remove('anim'); void slide.offsetWidth; slide.classList.add('anim');
    }

    document.getElementById('cardNum').textContent = String(queuePos + 1).padStart(2, '0');
    document.getElementById('cardType').textContent = c.t;
    document.getElementById('cardKanji').textContent = c.k;
    document.getElementById('cardHiragana').textContent = c.h;
    document.getElementById('cardMeaning').textContent = c.v;
    document.getElementById('cardExJP').textContent = c.ej;
    document.getElementById('cardExVN').textContent = c.ev;
    document.getElementById('cardTip').textContent = c.tip;

    const badge = document.getElementById('srsBadge');
    badge.className = 'srs-badge ' + srs.state;
    badge.textContent = srs.state === 'new' ? 'Mới' : srs.state === 'learn' ? 'Học lại' : 'Ôn tập';

    ['again', 'hard', 'good', 'easy'].forEach(r => {
        document.getElementById('int-' + r).textContent = fmtInterval(nextInterval(srs, r));
    });

    document.getElementById('progressFill').style.width = (queuePos / queue.length * 100).toFixed(1) + '%';
    document.getElementById('progressText').textContent = `${queuePos + 1} / ${queue.length}`;
    document.getElementById('showAnswerBtn').style.display = '';
    document.getElementById('ankiRow').classList.remove('visible');
    updateStats(); highlightMini();
}

function handleCardClick() { if (!isFlipped) revealAnswer(); }
function revealAnswer() {
    isFlipped = true;
    document.getElementById('mainCard').classList.add('flipped');
    document.getElementById('showAnswerBtn').style.display = 'none';
    document.getElementById('ankiRow').classList.add('visible');
}
function rate(rating) {
    const fIdx = queue[queuePos], allIdx = filteredMap[fIdx];
    applyRating(allIdx, rating); sessionStats[rating]++;
    if ((rating === 'again' || rating === 'hard') && !queue.slice(queuePos + 1).includes(fIdx)) queue.push(fIdx);
    queuePos++; buildMiniGrid(); updateStats(); showCard(true);
}
function updateStats() {
    let nN = 0, nL = 0, nR = 0;
    filteredMap.forEach(i => { const s = srsData[i].state; if (s === 'new') nN++; else if (s === 'learn') nL++; else nR++; });
    document.getElementById('statNew').textContent = nN;
    document.getElementById('statLearn').textContent = nL;
    document.getElementById('statReview').textContent = nR;
}
function prevCard() { if (queuePos > 0) { queuePos--; showCard(true); } }
function nextCard() { if (queuePos < queue.length - 1) { queuePos++; showCard(true); } }
function shuffleCards() {
    const rem = queue.slice(queuePos);
    for (let i = rem.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[rem[i], rem[j]] = [rem[j], rem[i]]; }
    queue = queue.slice(0, queuePos).concat(rem); showCard(true); buildMiniGrid();
}
function restartSession() {
    srsData = ALL_CARDS.map(() => ({ rating: null, state: 'new', ease: 2.5, interval: 0, reps: 0 }));
    sessionStats = { again: 0, hard: 0, good: 0, easy: 0 }; buildQueue();
    document.getElementById('cardScene').style.visibility = '';
    document.getElementById('ankiArea').style.display = '';
    document.getElementById('sessionDone').classList.remove('visible');
    showCard(true); buildMiniGrid(); updateStats();
}
function highlightMini() {
    const cur = queuePos < queue.length ? queue[queuePos] : -1;
    document.querySelectorAll('.mini-card').forEach((el, i) => el.classList.toggle('current', i === cur));
}
function buildMiniGrid() {
    const grid = document.getElementById('miniGrid'); grid.innerHTML = '';
    filteredMap.forEach((allIdx, fIdx) => {
        const c = ALL_CARDS[allIdx], srs = srsData[allIdx];
        const div = document.createElement('div');
        div.className = 'mini-card' + (srs.rating ? ' r-' + srs.rating : '');
        const dc = srs.state === 'review' ? 'var(--good)' : srs.state === 'learn' ? 'var(--again)' : '#ccc';
        div.innerHTML = `<span class="mk">${c.k}</span><span class="mh">${c.h}</span><span class="mv">${c.v}</span><span class="mini-dot" style="background:${dc}"></span>`;
        div.onclick = () => { const qi = queue.indexOf(fIdx); if (qi !== -1) { queuePos = qi; showCard(true); } };
        grid.appendChild(div);
    });
    highlightMini();
}

document.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!isFlipped) revealAnswer(); }
    else if (e.key === '1') { if (isFlipped) rate('again'); }
    else if (e.key === '2') { if (isFlipped) rate('hard'); }
    else if (e.key === '3') { if (isFlipped) rate('good'); }
    else if (e.key === '4') { if (isFlipped) rate('easy'); }
    else if (e.key === 'ArrowRight') nextCard();
    else if (e.key === 'ArrowLeft') prevCard();
});

initFiltered('all'); buildQueue(); showCard(false); buildMiniGrid(); updateStats();
