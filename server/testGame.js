const gm = require('./gameManager');

const code = gm.createRoom();
console.log('new room', code);
console.log('join1', gm.joinRoom(code, 'p1', 'Alice'));
console.log('join2', gm.joinRoom(code, 'p2', 'Bob'));

// force target for test
const room = gm.getRoom(code);
room.target = 'FRA';
console.log('set target', room.target);

let res = gm.processGuess(code, 'p1', 'ESP');
console.log('guess ESP by p1', res);

// advance turn manually
gm.advanceTurn(code);
res = gm.processGuess(code, 'p2', 'USA');
console.log('guess USA by p2', res);
