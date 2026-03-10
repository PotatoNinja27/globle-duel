import { initMap, colorCountry, resetMap } from './map.js';

const socket = io();

// --- State ---
let myId = null;
let myName = '';
let activePlayerId = null;
let timerInterval = null;

// --- Screen helpers ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// small temporary toast
function showToast(msg, duration = 3000) {
    const div = document.createElement('div');
    div.className = 'adjacent-toast';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), duration);
}

// --- Lobby ---
document.getElementById('create-btn').addEventListener('click', () => {
    const name = getPlayerName();
    if (!name) return;
    myName = name;
    socket.emit('createRoom', { playerName: name });
});

document.getElementById('join-btn').addEventListener('click', () => {
    const name = getPlayerName();
    const code = document.getElementById('room-code-input').value.trim().toUpperCase();
    if (!name) return;
    if (!code) { showLobbyError('Enter a room code'); return; }
    myName = name;
    socket.emit('joinRoom', { code, playerName: name });
});

function getPlayerName() {
    const name = document.getElementById('player-name').value.trim();
    if (!name) { showLobbyError('Enter your name'); return null; }
    return name;
}

function showLobbyError(msg) {
    document.getElementById('lobby-error').textContent = msg;
}

// --- Socket events ---
socket.on('connect', () => { myId = socket.id; });

socket.on('roomCreated', ({ code }) => {
    document.getElementById('display-code').textContent = code;
    showScreen('waiting-screen');
});

socket.on('gameStart', ({ players, activePlayerId: apId }) => {
    activePlayerId = apId;
    showScreen('game-screen');
    initMap();
    updateTurnIndicator();
    setGuessInputLocked(myId !== activePlayerId);
    startTimerBar(30);
});

socket.on('guessResult', ({ iso, name, distance, color, correct, adjacent }) => {
    colorCountry(iso, color);
    addGuessToHistory(name, distance, color, adjacent);
    if (correct) return; // gameOver will handle it
});

socket.on('opponentGuess', ({ iso, color }) => {
    colorCountry(iso, color);
});

socket.on('turnChange', ({ activePlayerId: apId, secondsLeft }) => {
    activePlayerId = apId;
    updateTurnIndicator();
    setGuessInputLocked(myId !== activePlayerId);
    resetTimerBar(secondsLeft);
});

socket.on('turnTimeout', ({ activePlayerId: apId, secondsLeft }) => {
    activePlayerId = apId;
    updateTurnIndicator();
    setGuessInputLocked(myId !== activePlayerId);
    resetTimerBar(secondsLeft);
});

socket.on('timerTick', ({ secondsLeft }) => {
    updateTimerBar(secondsLeft);
});

socket.on('gameOver', ({ winner, targetIso, targetName }) => {
    colorCountry(targetIso, 'rgb(76,175,80)');
    stopTimerBar();
    setGuessInputLocked(true);
    document.getElementById('win-title').textContent =
        winner === myName ? '🎉 You Win!' : `${winner} Wins!`;
    document.getElementById('win-target').textContent =
        `The country was ${targetName}`;
    document.getElementById('win-overlay').classList.remove('hidden');
});

socket.on('error', ({ message }) => {
    if (document.getElementById('lobby-screen').classList.contains('active')) {
        showLobbyError(message);
    } else {
        console.warn('Server error:', message);
        alert(message);
    }
});

socket.on('opponentWantsPlayAgain', () => {
    document.getElementById('win-title').textContent = '🏳️ Opponent wants to play again!';
    document.getElementById('play-again-btn').textContent = 'Play Again';
});

socket.on('gameRestart', ({ activePlayerId: apId }) => {
    activePlayerId = apId;
    document.getElementById('win-overlay').classList.add('hidden');
    document.getElementById('guess-history').innerHTML = '';
    resetMap();
    updateTurnIndicator();
    setGuessInputLocked(myId !== activePlayerId);
    startTimerBar(30);
});

// --- Play again ---
document.getElementById('play-again-btn').addEventListener('click', () => {
    socket.emit('playAgain');
    document.getElementById('play-again-btn').disabled = true;
    document.getElementById('play-again-btn').textContent = 'Waiting for opponent...';
});

document.getElementById('home-btn').addEventListener('click', () => {
    location.reload();
});

// --- Turn indicator ---
function updateTurnIndicator() {
    const el = document.getElementById('turn-indicator');
    if (myId === activePlayerId) {
        el.textContent = '🟢 Your turn — guess a country';
        el.className = 'your-turn';
    } else {
        el.textContent = "⏳ Opponent's turn";
        el.className = 'their-turn';
    }
}

// --- Guess input lock ---
function setGuessInputLocked(locked) {
    const input = document.getElementById('guess-input');
    input.disabled = locked;
    if (locked) {
        input.placeholder = "Opponent's turn...";
        document.querySelectorAll('#globe-container svg path').forEach(p => p.classList.add('locked'));
    } else {
        input.placeholder = 'Type a country...';
        input.focus();
        document.querySelectorAll('#globe-container svg path').forEach(p => p.classList.remove('locked'));
    }
}

// --- Timer bar ---
function startTimerBar(seconds) {
    updateTimerBar(seconds);
}

function resetTimerBar(seconds) {
    updateTimerBar(seconds);
}

function updateTimerBar(seconds) {
    const bar = document.getElementById('timer-bar-inner');
    const label = document.getElementById('timer-label');
    const pct = (seconds / 30) * 100;
    bar.style.width = pct + '%';
    bar.style.background = seconds > 10 ? '#4fc3f7' : seconds > 5 ? '#ff9800' : '#f44336';
    label.textContent = seconds + 's';
}

function stopTimerBar() {
    const bar = document.getElementById('timer-bar-inner');
    bar.style.width = '0%';
}

// --- Guess history ---
function addGuessToHistory(name, distance, color, adjacent) {
    const li = document.createElement('li');
    li.className = 'guess-item';
    li.innerHTML = `
        <div class="guess-color-dot" style="background:${color}"></div>
        <span class="guess-country">${name}</span>
        <span class="guess-distance">${distance === 0 ? '✓' : distance.toLocaleString() + ' km'}</span>
    `;
    if (adjacent) {
        const tag = document.createElement('div');
        tag.className = 'adjacent-tag';
        tag.textContent = '🤝 Borders mystery country!';
        li.appendChild(tag);
        showToast('This country borders the mystery country!');
    }
    const list = document.getElementById('guess-history');
    list.insertBefore(li, list.firstChild);
}

// --- Autocomplete ---
import { getCountryList } from './map.js';

const guessInput = document.getElementById('guess-input');
const autocompleteList = document.getElementById('autocomplete-list');
let selectedIndex = -1;

guessInput.addEventListener('input', () => {
    const val = guessInput.value.trim().toLowerCase();
    autocompleteList.innerHTML = '';
    selectedIndex = -1;
    if (!val) return;

    const matches = getCountryList()
        .filter(c => c.name.toLowerCase().startsWith(val))
        .slice(0, 8);

    matches.forEach((c, i) => {
        const li = document.createElement('li');
        li.textContent = c.name;
        li.addEventListener('mousedown', () => submitGuess(c.iso));
        autocompleteList.appendChild(li);
    });
});

guessInput.addEventListener('keydown', (e) => {
    const items = autocompleteList.querySelectorAll('li');
    if (e.key === 'ArrowDown') {
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
        selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && items[selectedIndex]) {
            items[selectedIndex].dispatchEvent(new Event('mousedown'));
        } else if (items.length === 1) {
            items[0].dispatchEvent(new Event('mousedown'));
        }
        return;
    } else if (e.key === 'Escape') {
        autocompleteList.innerHTML = '';
        return;
    }
    items.forEach((li, i) => li.classList.toggle('selected', i === selectedIndex));
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('#guess-input-wrap')) autocompleteList.innerHTML = '';
});

function submitGuess(iso) {
    if (myId !== activePlayerId) return;
    socket.emit('submitGuess', { iso });
    guessInput.value = '';
    autocompleteList.innerHTML = '';
}

export { submitGuess };