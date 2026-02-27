const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const gm = require('./gameManager');
const countries = require('./countries.json');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(express.static('client'));

io.on('connection', (socket) => {
    console.log('Connected:', socket.id);

    socket.on('createRoom', ({ playerName }) => {
        const code = gm.createRoom();
        const result = gm.joinRoom(code, socket.id, playerName);
        socket.join(code);
        socket.data.roomCode = code;
        socket.data.playerName = playerName;
        socket.emit('roomCreated', { code });
        console.log(`[${code}] ${playerName} created room`);
    });

    socket.on('joinRoom', ({ code, playerName }) => {
        const result = gm.joinRoom(code.toUpperCase(), socket.id, playerName);
        if (result.error) {
            socket.emit('error', { message: result.error });
            return;
        }

        socket.join(code.toUpperCase());
        socket.data.roomCode = code.toUpperCase();
        socket.data.playerName = playerName;

        const room = result.room;
        const p0 = room.players[0];
        const p1 = room.players[1];

        // Tell both players the game is starting
        io.to(code.toUpperCase()).emit('gameStart', {
            players: [p0.name, p1.name],
            activePlayer: p0.name,
            activePlayerId: p0.id,
        });

        startRoomTimer(code.toUpperCase());
        console.log(`[${code}] ${playerName} joined — game starting`);
    });

    socket.on('submitGuess', ({ iso }) => {
        const code = socket.data.roomCode;
        if (!code) return;

        const result = gm.processGuess(code, socket.id, iso);
        if (result.error) {
            socket.emit('error', { message: result.error });
            return;
        }

        const { guess, correct } = result;
        const room = gm.getRoom(code);

        // Send full info to guesser
        socket.emit('guessResult', {
            iso: guess.iso,
            name: guess.name,
            distance: guess.distance,
            color: guess.color,
            correct,
        });

        // Send color only to opponent
        socket.to(code).emit('opponentGuess', {
            iso: guess.iso,
            name: guess.name,
            color: guess.color,
        });

        if (correct) {
            io.to(code).emit('gameOver', {
                winner: guess.playerName,
                targetIso: result.target,
                targetName: result.targetName,
            });
            return;
        }

        // Advance turn and restart timer
        gm.advanceTurn(code);
        const updatedRoom = gm.getRoom(code);
        const active = gm.getActivePlayer(updatedRoom);

        io.to(code).emit('turnChange', {
            activePlayer: active.name,
            activePlayerId: active.id,
            secondsLeft: 30,
        });

        startRoomTimer(code);
    });

    socket.on('disconnect', () => {
        const code = gm.removePlayer(socket.id);
        if (code) {
            io.to(code).emit('error', { message: 'Opponent disconnected. Game ended.' });
            console.log(`[${code}] Player disconnected, room closed`);
        }
    });
});

function startRoomTimer(code) {
    gm.startTimer(
        code,
        (secondsLeft) => {
            io.to(code).emit('timerTick', { secondsLeft });
        },
        () => {
            // Timeout — skip turn
            const room = gm.getRoom(code);
            if (!room || room.status !== 'active') return;

            gm.advanceTurn(code);
            const active = gm.getActivePlayer(gm.getRoom(code));

            io.to(code).emit('turnTimeout', {
                activePlayer: active.name,
                activePlayerId: active.id,
                secondsLeft: 30,
            });

            startRoomTimer(code);
        }
    );
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));