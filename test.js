const gm = require('./server/gameManager');

const code = gm.createRoom();
console.log('Room created:', code);

const j1 = gm.joinRoom(code, 'p1', 'Alice');
console.log('Alice joined:', j1.ok, '| Status:', j1.room.status);

const j2 = gm.joinRoom(code, 'p2', 'Bob');
console.log('Bob joined:', j2.ok, '| Status:', j2.room.status, '| Target:', j2.room.target);

// Wrong turn
const bad = gm.processGuess(code, 'p2', 'FRA');
console.log('Bob guesses on Alice turn (should error):', bad.error);

// Alice guesses
const g1 = gm.processGuess(code, 'p1', 'BRA');
console.log('Alice guesses BRA:', g1.guess.name, g1.guess.distance + 'km', g1.guess.color);