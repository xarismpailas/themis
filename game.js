const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const snakeHeadImg = document.getElementById('snakeHead');
const snakeBodyImg = document.getElementById('snakeBody');
const foodImg = document.getElementById('foodImg');
const boostImg = document.getElementById('boostImg');
const startScreen = document.getElementById('startScreen');
const loadingScreen = document.getElementById('loadingScreen');
const gameOverlay = document.getElementById('gameOverlay');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const playerNameInput = document.getElementById('playerName');
const nameError = document.getElementById('nameError');
const leaderboardList = document.getElementById('leaderboardList');
const soundControl = document.getElementById('soundControl');

// Game state
let snake = [{x: 10, y: 10}]; // Starting position
let food = {x: 15, y: 15};
let boost = null;
let direction = 'right';
let score = 0;
let gameLoop = null;
const gridSize = 20;
let playerName = '';

// Boost state
let boostActive = false;
let boostFoodsRemaining = 0;
let boostMultiplier = 2;

// YouTube player
let player;
let isMuted = localStorage.getItem('snakeGameMuted') === 'true';

// Initialize YouTube player
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        videoId: '_JG3zJKL45c',
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'loop': 1,
            'playlist': '_JG3zJKL45c' // needed for looping
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    updateSoundControlState();
}

function onPlayerStateChange(event) {
    // When video ends, replay if not muted
    if (event.data === YT.PlayerState.ENDED && !isMuted) {
        player.playVideo();
    }
}

// Sound control functions
function updateSoundControlState() {
    if (isMuted) {
        soundControl.classList.add('muted');
        if (player && player.pauseVideo) {
            player.pauseVideo();
        }
    } else {
        soundControl.classList.remove('muted');
        if (player && player.playVideo) {
            player.playVideo();
        }
    }
    localStorage.setItem('snakeGameMuted', isMuted);
}

// Handle sound control click
soundControl.addEventListener('click', () => {
    isMuted = !isMuted;
    updateSoundControlState();
});

// Function to start playing the hymn
function startHymn() {
    if (!isMuted && player && player.playVideo) {
        player.seekTo(0);
        player.playVideo();
    }
}

// Set canvas size
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Handle keyboard input
const keys = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'w': 'up',
    's': 'down',
    'a': 'left',
    'd': 'right'
};

document.addEventListener('keydown', (e) => {
    const newDirection = keys[e.key];
    if (newDirection) {
        e.preventDefault();
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        if (opposites[newDirection] !== direction) {
            direction = newDirection;
        }
    }
});

// Generate new food position
function generateFood() {
    let newPos;
    do {
        newPos = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
        };
    } while (isPositionOccupied(newPos));
    return newPos;
}

// Generate boost position
function generateBoost() {
    if (Math.random() < 0.2) { // 20% chance to spawn boost
        let newPos;
        do {
            newPos = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize)
            };
        } while (isPositionOccupied(newPos));
        return newPos;
    }
    return null;
}

// Check if position is occupied by snake or food
function isPositionOccupied(pos) {
    // Check snake body
    for (let segment of snake) {
        if (segment.x === pos.x && segment.y === pos.y) {
            return true;
        }
    }
    // Check food
    if (food.x === pos.x && food.y === pos.y) {
        return true;
    }
    // Check boost
    if (boost && boost.x === pos.x && boost.y === pos.y) {
        return true;
    }
    return false;
}

// Check collisions
function checkCollision(head) {
    // Wall collision
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        return true;
    }
    
    // Self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Update boost state
function updateBoostState() {
    if (boostActive && boostFoodsRemaining > 0) {
        document.querySelector('.score').classList.add('boost-active');
    } else {
        document.querySelector('.score').classList.remove('boost-active');
        boostActive = false;
    }
}

// Show loading screen
function showLoadingScreen() {
    loadingScreen.style.display = 'flex';
}

// Hide loading screen
function hideLoadingScreen() {
    loadingScreen.style.display = 'none';
}

// Initialize and start the game
function initializeGame() {
    snake = [{x: 10, y: 10}];
    direction = 'right';
    score = 0;
    food = generateFood();
    boost = null;
    boostActive = false;
    boostFoodsRemaining = 0;
    document.getElementById('score').textContent = '0';
    document.getElementById('gameOverlay').style.display = 'none';
    document.querySelector('.score').classList.remove('boost-active');
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 100);
    
    // Draw initial state
    draw();
}

// Handle play now button click
function handlePlayNow() {
    playerName = playerNameInput.value.trim();
    if (!playerName) {
        nameError.style.display = 'block';
        return;
    }
    nameError.style.display = 'none';
    showLoadingScreen();
    
    // Start the hymn
    startHymn();
    
    setTimeout(() => {
        hideLoadingScreen();
        startScreen.style.display = 'none';
        initializeGame();
    }, 2000);
}

// Game loop
function update() {
    // Move snake
    const head = {...snake[0]};
    
    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Check collision
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        const points = boostActive ? 10 * boostMultiplier : 10;
        score += points;
        document.getElementById('score').textContent = score;
        food = generateFood();
        
        if (boostActive) {
            boostFoodsRemaining--;
            if (boostFoodsRemaining === 0) {
                boostActive = false;
            }
        }
        
        // Generate new boost if none exists
        if (!boost && !boostActive) {
            boost = generateBoost();
        }
    } 
    // Check boost collision
    else if (boost && head.x === boost.x && head.y === boost.y) {
        boostActive = true;
        boostFoodsRemaining = 4;
        boost = null;
    }
    else {
        snake.pop();
    }
    
    updateBoostState();
    draw();
}

// Draw game
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;
    
    // Draw grid
    ctx.strokeStyle = '#333';
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            ctx.strokeRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
        }
    }
    
    // Draw food
    ctx.save();
    ctx.translate(food.x * cellWidth + cellWidth/2, food.y * cellHeight + cellHeight/2);
    
    // Add a slight rotation animation to the food
    const time = new Date().getTime() * 0.001;
    const rotation = Math.sin(time * 2) * 0.1;
    ctx.rotate(rotation);
    
    // Draw the food image
    ctx.drawImage(foodImg, 
        -cellWidth/2, -cellHeight/2, 
        cellWidth, cellHeight);
    ctx.restore();
    
    // Draw boost if it exists
    if (boost) {
        ctx.save();
        ctx.translate(boost.x * cellWidth + cellWidth/2, boost.y * cellHeight + cellHeight/2);
        
        // Add a floating animation to the boost
        const boostFloat = Math.sin(time * 3) * 5;
        ctx.translate(0, boostFloat);
        
        // Add a glow effect
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        
        ctx.drawImage(boostImg,
            -cellWidth/2, -cellHeight/2,
            cellWidth, cellHeight);
        ctx.restore();
    }
    
    // Draw snake
    snake.forEach((segment, index) => {
        ctx.save();
        ctx.translate(segment.x * cellWidth + cellWidth/2, segment.y * cellHeight + cellHeight/2);
        
        if (index === 0) {
            // Rotate head based on direction
            let rotation = 0;
            switch(direction) {
                case 'up': rotation = -Math.PI/2; break;
                case 'down': rotation = Math.PI/2; break;
                case 'left': rotation = Math.PI; break;
                case 'right': rotation = 0; break;
            }
            ctx.rotate(rotation);
            
            // Add glow effect when boost is active
            if (boostActive) {
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;
            }
            
            // Draw head
            ctx.drawImage(snakeHeadImg, 
                -cellWidth/2, -cellHeight/2, 
                cellWidth, cellHeight);
        } else {
            // Calculate rotation for body segments
            let prevSegment = snake[index - 1];
            let nextSegment = snake[index + 1];
            let rotation = 0;
            
            if (prevSegment && nextSegment) {
                let dx = prevSegment.x - nextSegment.x;
                let dy = prevSegment.y - nextSegment.y;
                rotation = Math.atan2(dy, dx);
            } else {
                let dx = prevSegment.x - segment.x;
                let dy = prevSegment.y - segment.y;
                rotation = Math.atan2(dy, dx);
            }
            
            ctx.rotate(rotation);
            
            // Add glow effect when boost is active
            if (boostActive) {
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 5;
            }
            
            // Draw body segment
            ctx.drawImage(snakeBodyImg, 
                -cellWidth/2, -cellHeight/2, 
                cellWidth, cellHeight);
        }
        ctx.restore();
    });
}

// Game over
function gameOver() {
    clearInterval(gameLoop);
    finalScoreElement.textContent = score;
    
    // Add score to leaderboard and update both leaderboards
    addToLeaderboard(playerName, score);
    updateGameOverLeaderboard();
    
    // Show game over overlay
    gameOverlay.style.display = 'flex';
}

// Update game over leaderboard
function updateGameOverLeaderboard() {
    const leaderboard = getLeaderboard();
    const gameOverLeaderboardList = document.getElementById('gameOverLeaderboard');
    gameOverLeaderboardList.innerHTML = '';
    
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        li.innerHTML = `
            <span>${index + 1}. ${entry.name}</span>
            <span>${entry.score}</span>
        `;
        gameOverLeaderboardList.appendChild(li);
    });
}

// Initialize game
function initGame() {
    // Set initial sound state
    updateSoundControlState();
    
    // Show loading screen immediately
    showLoadingScreen();
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Initialize leaderboard
    updateLeaderboard();
    
    // Show start screen after loading
    setTimeout(() => {
        hideLoadingScreen();
        showStartScreen();
        // Draw empty grid
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cellWidth = canvas.width / gridSize;
        const cellHeight = canvas.height / gridSize;
        ctx.strokeStyle = '#333';
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                ctx.strokeRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
            }
        }
    }, 2000);
}

// Leaderboard functions
function getLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('snakeLeaderboard')) || [];
    return leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
}

function updateLeaderboard() {
    const leaderboard = getLeaderboard();
    leaderboardList.innerHTML = '';
    
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        li.innerHTML = `
            <span>${index + 1}. ${entry.name}</span>
            <span>${entry.score}</span>
        `;
        leaderboardList.appendChild(li);
    });
}

function addToLeaderboard(name, score) {
    const leaderboard = getLeaderboard();
    
    // Find if player already exists
    const existingPlayerIndex = leaderboard.findIndex(entry => entry.name.toLowerCase() === name.toLowerCase());
    
    if (existingPlayerIndex !== -1) {
        // If player exists and new score is higher, update their score
        if (score > leaderboard[existingPlayerIndex].score) {
            leaderboard[existingPlayerIndex].score = score;
        }
    } else {
        // If player doesn't exist, add them
        leaderboard.push({ name, score });
    }
    
    // Sort by score and keep top 10
    const sortedLeaderboard = leaderboard
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    
    localStorage.setItem('snakeLeaderboard', JSON.stringify(sortedLeaderboard));
    updateLeaderboard();
}

function clearLeaderboardEntries(nameToRemove) {
    const leaderboard = JSON.parse(localStorage.getItem('snakeLeaderboard')) || [];
    const filteredLeaderboard = leaderboard.filter(entry => 
        entry.name.toLowerCase() !== nameToRemove.toLowerCase()
    );
    localStorage.setItem('snakeLeaderboard', JSON.stringify(filteredLeaderboard));
    updateLeaderboard();
    updateGameOverLeaderboard();
}

// Clear the specific entries when the game loads
clearLeaderboardEntries('χαρης');

// Start screen functions
function showStartScreen() {
    startScreen.style.display = 'flex';
    playerNameInput.value = '';
    updateLeaderboard();
}

// Event listeners
document.getElementById('playAgain').addEventListener('click', () => {
    gameOverlay.style.display = 'none';
    showLoadingScreen();
    setTimeout(() => {
        hideLoadingScreen();
        initializeGame();
    }, 2000);
});

document.getElementById('playNow').addEventListener('click', handlePlayNow);

// Initialize game when the page loads
window.onload = initGame; 