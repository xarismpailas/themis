const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('./'));

const gameState = {
    players: new Map(),
    food: [],
    gridSize: 20,
    gameLoop: null
};

function generateFood() {
    const x = Math.floor(Math.random() * gameState.gridSize);
    const y = Math.floor(Math.random() * gameState.gridSize);
    return { x, y };
}

function updateGame() {
    // Update food if needed
    if (gameState.food.length < 5) {
        gameState.food.push(generateFood());
    }

    // Update player positions
    gameState.players.forEach((player, id) => {
        const head = player.snake[0];
        const newHead = { ...head };

        switch (player.direction) {
            case 'up': newHead.y--; break;
            case 'down': newHead.y++; break;
            case 'left': newHead.x--; break;
            case 'right': newHead.x++; break;
        }

        // Check for collisions with walls
        if (newHead.x < 0 || newHead.x >= gameState.gridSize ||
            newHead.y < 0 || newHead.y >= gameState.gridSize) {
            player.alive = false;
            return;
        }

        // Check for collisions with self
        for (let i = 1; i < player.snake.length; i++) {
            if (newHead.x === player.snake[i].x && newHead.y === player.snake[i].y) {
                player.alive = false;
                return;
            }
        }

        player.snake.unshift(newHead);

        // Check for food collision
        const foodIndex = gameState.food.findIndex(f => f.x === newHead.x && f.y === newHead.y);
        if (foodIndex !== -1) {
            gameState.food.splice(foodIndex, 1);
            player.score += 10;
        } else {
            player.snake.pop();
        }
    });

    // Remove dead players
    for (const [id, player] of gameState.players.entries()) {
        if (!player.alive) {
            gameState.players.delete(id);
        }
    }

    // Broadcast game state to all players
    io.emit('gameState', {
        players: Array.from(gameState.players.entries()),
        food: gameState.food
    });
}

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Initialize new player
    const player = {
        id: socket.id,
        snake: [{ x: Math.floor(Math.random() * gameState.gridSize), y: Math.floor(Math.random() * gameState.gridSize) }],
        direction: 'right',
        score: 0,
        alive: true
    };

    gameState.players.set(socket.id, player);

    // Handle player input
    socket.on('direction', (direction) => {
        const player = gameState.players.get(socket.id);
        if (player) {
            const opposites = {
                'up': 'down',
                'down': 'up',
                'left': 'right',
                'right': 'left'
            };
            if (opposites[direction] !== player.direction) {
                player.direction = direction;
            }
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        gameState.players.delete(socket.id);
        console.log('Player disconnected:', socket.id);
    });
});

// Start game loop
gameState.gameLoop = setInterval(updateGame, 100);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 