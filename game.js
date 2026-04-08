document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('game-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    const overlay = document.getElementById('game-overlay');
    const msgTitle = document.getElementById('game-msg-title');
    const msgSub = document.getElementById('game-msg-sub');
    const btnStart = document.getElementById('btn-start-game');
    
    const scoreEl = document.getElementById('game-score');
    const highScoreEl = document.getElementById('game-high-score');

    // --- GAME CONSTANTS & STATE ---
    let animationId;
    let score = 0;
    let highScore = localStorage.getItem('potato_beetle_high') || 0;
    highScoreEl.innerText = `High: ${Math.floor(highScore)}`;
    
    let gameSpeed = 5;
    const INITIAL_SPEED = 5;
    let isPlaying = false;
    let isGameOver = false;

    // --- ENTITIES ---
    const player = {
        x: 50,
        y: 200,
        w: 40,
        h: 40,
        vy: 0,
        gravity: 0.6,
        jumpPower: -11,
        grounded: false,
        crouching: false,
        emoji: '🐞',
        baseY: 210 // Ground level
    };

    let obstacles = [];
    let spawnTimer = 0;
    const minSpawnTime = 60;
    let particles = [];

    // --- EVENT LISTENERS ---
    window.addEventListener('keydown', (e) => {
        if(!isPlaying) return;
        if(e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault(); // stop scrolling
            jump();
        }
        if(e.code === 'ArrowDown') {
            e.preventDefault();
            crouch(true);
        }
    });

    window.addEventListener('keyup', (e) => {
        if(!isPlaying) return;
        if(e.code === 'ArrowDown') crouch(false);
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        if(!isPlaying) return;
        e.preventDefault();
        
        let touch = e.touches[0];
        // simple heuristic: tap left/top = jump, swipe down/bottom = crouch
        // For simplicity, any tap jumps unless we hold down. Let's do tap = jump.
        jump();
    });

    btnStart.addEventListener('click', initGame);

    // --- GAME LOGIC ---
    function jump() {
        if(player.grounded && !player.crouching) {
            player.vy = player.jumpPower;
            player.grounded = false;
        }
    }

    function crouch(state) {
        if(state) {
            player.crouching = true;
            player.h = 20; // flattened box
            // push down immediately if in air (fast fall)
            if(!player.grounded) player.vy += 2;
        } else {
            player.crouching = false;
            player.h = 40;
        }
    }

    function spawnObstacle() {
        let type = Math.random() > 0.5 ? 'low' : 'high';
        let obs = {
            x: canvas.width,
            w: 40,
            h: 40,
            speed: gameSpeed,
            type: type,
            passed: false
        };

        if(type === 'low') {
            obs.y = player.baseY; // Ground level obstacle
            let lowEmojis = ['🍿', '🍦', '🍫']; // Cheese popcorn, ice cream, dark chocolate
            obs.emoji = lowEmojis[Math.floor(Math.random() * lowEmojis.length)];
        } else {
            obs.y = player.baseY - 45; // High obstacle (requires crouching)
            let highEmojis = ['🪷', '🌸']; // Lillie / cute flowers
            obs.emoji = highEmojis[Math.floor(Math.random() * highEmojis.length)];
        }

        obstacles.push(obs);
    }

    function spawnSparkles(x, y) {
        for(let i=0; i<3; i++) {
            particles.push({
                x: x, y: y,
                vx: (Math.random()-0.5)*2,
                vy: (Math.random()-0.5)*2,
                life: 30,
                emoji: '✨'
            });
        }
    }

    function update() {
        if(!isPlaying) return;

        // Score & Speed
        score += 0.05;
        scoreEl.innerText = `Score: ${Math.floor(score)}`;
        gameSpeed += 0.002; // slowly increase speed

        // Physics
        player.y += player.vy;
        if(!player.grounded) {
            player.vy += player.gravity;
        }

        // Ground constraint
        let effectiveH = player.crouching ? 20 : 40;
        let groundY = player.baseY + (40 - effectiveH);

        if(player.y >= groundY) {
            player.y = groundY;
            player.vy = 0;
            player.grounded = true;
        } else {
            player.grounded = false;
        }

        // Spawn logic
        spawnTimer--;
        // Randomize spawn window slightly based on speed
        if(spawnTimer <= 0) {
            spawnObstacle();
            spawnTimer = minSpawnTime + Math.random() * (120 - gameSpeed*5);
        }

        // Move obstacles
        for(let i=0; i<obstacles.length; i++) {
            let obs = obstacles[i];
            obs.x -= gameSpeed;

            // Collision Detection (AABB)
            // Shrink hitbox slightly to make it fair
            let pRight = player.x + player.w - 10;
            let pLeft = player.x + 10;
            let pTop = player.y + 10;
            let pBottom = player.y + player.h - 5;

            let oRight = obs.x + obs.w - 10;
            let oLeft = obs.x + 10;
            let oTop = obs.y + 10;
            let oBottom = obs.y + obs.h - 5;

            if (pLeft < oRight && pRight > oLeft && pTop < oBottom && pBottom > oTop) {
                gameOver();
            }

            // Score pulse logic
            if(!obs.passed && obs.x + obs.w < player.x) {
                obs.passed = true;
                score += 5; // bonus flat score
                spawnSparkles(player.x, player.y);
            }
        }

        // Remove offscreen obstacles
        obstacles = obstacles.filter(o => o.x + o.w > 0);

        // Update particles
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        });
        particles = particles.filter(p => p.life > 0);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Ground Line
        ctx.beginPath();
        ctx.moveTo(0, player.baseY + 40);
        ctx.lineTo(canvas.width, player.baseY + 40);
        let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.strokeStyle = isDark ? "rgba(192, 132, 252, 0.4)" : "rgba(223, 169, 184, 0.4)"; // soft pastel line
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Player
        ctx.font = "40px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        
        ctx.save();
        if(player.crouching) {
            // Squish logic visual
            ctx.translate(player.x, player.y + 20); // move down
            ctx.scale(1, 0.5); 
            ctx.fillText(player.emoji, 0, 0);
        } else {
            ctx.fillText(player.emoji, player.x, player.y);
        }
        ctx.restore();

        // Draw Obstacles
        for(let o of obstacles) {
            ctx.font = "35px Arial";
            ctx.fillText(o.emoji, o.x, o.y);
        }

        // Draw Particles
        for(let p of particles) {
            ctx.font = "20px Arial";
            ctx.globalAlpha = p.life / 30;
            ctx.fillText(p.emoji, p.x, p.y);
            ctx.globalAlpha = 1.0;
        }
    }

    function gameLoop() {
        if(isPlaying) {
            update();
            draw();
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    function initGame() {
        // Reset state
        score = 0;
        gameSpeed = INITIAL_SPEED;
        obstacles = [];
        particles = [];
        spawnTimer = 60;
        player.y = player.baseY;
        player.vy = 0;
        player.crouching = false;
        
        isPlaying = true;
        isGameOver = false;
        
        overlay.classList.add('hidden');
        
        if(animationId) cancelAnimationFrame(animationId);
        gameLoop();
    }

    function gameOver() {
        isPlaying = false;
        isGameOver = true;
        
        if(score > highScore) {
            highScore = score;
            localStorage.setItem('potato_beetle_high', Math.floor(highScore));
            highScoreEl.innerText = `High: ${Math.floor(highScore)}`;
        }

        const msgs = [
            "Oh no... beetle tripped 🥺",
            "Try again, potato! 🥔💖",
            "You were doing so well! ✨",
            "Take a deep breath and jump 💕"
        ];

        msgTitle.innerText = "Game Over!";
        msgSub.innerText = msgs[Math.floor(Math.random() * msgs.length)];
        btnStart.innerText = "Play Again 🔄";
        
        overlay.classList.remove('hidden');
    }

    // Initial silent draw to show the beetle sitting there
    player.y = player.baseY;
    draw();

});
