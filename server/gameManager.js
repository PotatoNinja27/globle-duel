const { getDistanceInfo } = require('./distance');
const countries = require('./countries.json');

const rooms = {};

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function pickTarget() {
    const keys = Object.keys(countries);
    return keys[Math.floor(Math.random() * keys.length)];
}

function createRoom() {
    const code = generateRoomCode();
    rooms[code] = {
        code,
        players: [],        // [{ id, name }]
        activeIndex: 0,     // whose turn (0 or 1)
        target: null,
        guesses: [],        // { playerId, iso, name, distance, color }
        status: 'waiting',  // waiting | active | finished
        timer: null,
        secondsLeft: 30,
    };
    return code;
}

function joinRoom(code, playerId, playerName) {
    const room = rooms[code];
    if (!room) return { error: 'Room not found' };
    if (room.players.length >= 2) return { error: 'Room is full' };
    if (room.status !== 'waiting') return { error: 'Game already started' };

    room.players.push({ id: playerId, name: playerName });

    if (room.players.length === 2) {
        room.status = 'active';
        room.target = pickTarget();
        console.log(`[${code}] Game started. Target: ${room.target}`);
    }

    return { ok: true, room };
}

function getActivePlayer(room) {
    return room.players[room.activeIndex];
}

function processGuess(code, playerId, iso) {
    const room = rooms[code];
    if (!room) return { error: 'Room not found' };
    if (room.status !== 'active') return { error: 'Game not active' };

    const active = getActivePlayer(room);
    if (active.id !== playerId) return { error: 'Not your turn' };

    const upperIso = iso.toUpperCase();
    if (!countries[upperIso]) return { error: 'Unknown country' };

    const correct = upperIso === room.target;
    let distanceInfo = null;

    if (correct) {
        distanceInfo = { distance: 0, normalized: 1, color: 'rgb(76,175,80)' };
    } else {
        distanceInfo = getDistanceInfo(upperIso, room.target);
        if (!distanceInfo) return { error: 'Could not calculate distance' };
    }

    const guess = {
        playerId,
        playerName: active.name,
        iso: upperIso,
        name: countries[upperIso].name,
        distance: distanceInfo.distance,
        color: distanceInfo.color,
        adjacent: distanceInfo.adjacent || false,
        correct,
    };

    room.guesses.push(guess);

    if (correct) {
        room.status = 'finished';
        clearTimer(room);
        return { guess, correct: true, target: room.target, targetName: countries[room.target].name };
    }

    return { guess, correct: false };
}

function advanceTurn(code) {
    const room = rooms[code];
    if (!room || room.status !== 'active') return;
    room.activeIndex = room.activeIndex === 0 ? 1 : 0;
    room.secondsLeft = 30;
}

function clearTimer(room) {
    if (room.timer) {
        clearInterval(room.timer);
        room.timer = null;
    }
}

function startTimer(code, onTick, onTimeout) {
    const room = rooms[code];
    if (!room) return;
    clearTimer(room);
    room.secondsLeft = 30;

    room.timer = setInterval(() => {
        room.secondsLeft--;
        onTick(room.secondsLeft);
        if (room.secondsLeft <= 0) {
            clearTimer(room);
            onTimeout();
        }
    }, 1000);
}

function getRoom(code) {
    return rooms[code] || null;
}

function removePlayer(playerId) {
    for (const code in rooms) {
        const room = rooms[code];
        const idx = room.players.findIndex(p => p.id === playerId);
        if (idx !== -1) {
            clearTimer(room);
            delete rooms[code];
            return code;
        }
    }
    return null;
}

function resetRoom(code) {
    const room = rooms[code];
    if (!room) return { error: 'Room not found' };
    clearTimer(room);
    room.target = pickTarget();
    room.guesses = [];
    room.status = 'active';
    room.activeIndex = 0;
    room.secondsLeft = 30;
    console.log(`[${code}] Room reset. New target: ${room.target}`);
    return { ok: true, room };
}

module.exports = { createRoom, joinRoom, processGuess, advanceTurn, startTimer, clearTimer, getRoom, getActivePlayer, removePlayer, resetRoom };