class PlatformerScene extends Phaser.Scene {
    constructor() {
        super('PlatformerScene');
        this.score = 0;
        this.lives = 3;
        this.isGameOver = false;
        this.coinsCollected = 0;
        this.totalCoins = 0;
        this.platforms = null;
        this.coins = null;
        this.enemies = null;
        this.player = null;
        this.cursors = null;
        this.scoreText = null;
        this.livesText = null;
        this.enemySpeed = 60;
        this.groundY = 550;
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.isOnGround = false;
    }

    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, 1200, 600);

        // Create beautiful background
        this.add.graphics()
            .fillStyle(0x87CEEB)
            .fillRect(0, 0, 1200, 600);
        
        // Add clouds
        for (let i = 0; i < 6; i++) {
            const x = Phaser.Math.Between(50, 1150);
            const y = Phaser.Math.Between(20, 150);
            this.add.graphics()
                .fillStyle(0xffffff, 0.6)
                .fillCircle(x, y, 30)
                .fillCircle(x + 40, y - 10, 35)
                .fillCircle(x + 80, y, 30)
                .fillCircle(x + 20, y + 15, 25)
                .fillCircle(x + 60, y + 15, 25);
        }

        // Create ground
        this.ground = this.physics.add.staticGroup();
        this.ground.create(0, this.groundY, 'ground').setScale(24, 1).refreshBody();
        
        // Create platforms
        this.platforms = this.physics.add.staticGroup();
        this.createPlatforms();

        // Create coins
        this.coins = this.physics.add.staticGroup();
        this.createCoins();

        // Create enemies
        this.enemies = this.physics.add.group({
            allowGravity: false
        });
        this.createEnemies();

        // Create player
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(500);
        this.player.setSize(20, 30);
        this.player.setOffset(6, 10);

        // Player animations
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 10
        });

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: [{ key: 'player', frame: 2 }],
            frameRate: 10
        });

        // Collisions
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.ground);
        this.physics.add.collider(this.enemies, this.platforms);

        // Coin collection
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        // Enemy collision
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();

        // UI
        this.scoreText = document.getElementById('score');
        this.livesText = document.getElementById('lives');
        this.updateUI();

        // Game over overlay
        this.gameOverOverlay = document.getElementById('game-over');
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
    }

    createPlatforms() {
        // Platform configurations: [x, y, width, height]
        const platformConfigs = [
            [200, 480, 150, 20],
            [400, 420, 150, 20],
            [600, 360, 150, 20],
            [800, 420, 150, 20],
            [1000, 480, 150, 20],
            [300, 280, 120, 20],
            [550, 220, 120, 20],
            [800, 280, 120, 20]
        ];

        platformConfigs.forEach(([x, y, w, h]) => {
            const platform = this.platforms.create(x, y, 'platform');
            platform.setDisplaySize(w, h);
            platform.refreshBody();
            
            // Add visual style
            this.add.graphics()
                .fillStyle(0x8B4513)
                .fillRect(x - w/2, y - h/2, w, h)
                .fillStyle(0x6B3410)
                .fillRect(x - w/2 + 5, y - h/2 + 3, w - 10, h/2);
        });
    }

    createCoins() {
        const coinPositions = [
            [250, 440],
            [350, 440],
            [450, 380],
            [550, 380],
            [650, 320],
            [750, 320],
            [850, 380],
            [950, 380],
            [1050, 440],
            [350, 240],
            [600, 180],
            [850, 240]
        ];

        coinPositions.forEach(([x, y]) => {
            const coin = this.coins.create(x, y, 'coin');
            coin.setDisplaySize(20, 20);
            coin.refreshBody();
            this.totalCoins++;
        });
    }

    createEnemies() {
        const enemyPositions = [
            [500, 530],
            [700, 530],
            [900, 530],
            [350, 260],
            [750, 260]
        ];

        enemyPositions.forEach(([x, y]) => {
            const enemy = this.enemies.create(x, y, 'enemy');
            enemy.setDisplaySize(30, 30);
            enemy.setBounce(0.5);
            enemy.setCollideWorldBounds(true);
            enemy.body.setVelocityX(this.enemySpeed * (Math.random() > 0.5 ? 1 : -1));
            enemy.body.setAllowGravity(true);
            enemy.body.setGravityY(300);
            
            // Store original y for patrol
            enemy.patrolY = y;
            enemy.patrolRange = 50;
        });
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.score += 10;
        this.coinsCollected++;
        this.updateUI();
        
        // Visual feedback
        const text = this.add.text(coin.x, coin.y - 30, '+10', {
            fontSize: '24px',
            fill: '#ffd700',
            fontStyle: 'bold'
        });
        this.tweens.add({
            targets: text,
            y: text.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });

        // Check if all coins collected
        if (this.coinsCollected === this.totalCoins) {
            this.showVictoryMessage();
        }
    }

    hitEnemy(player, enemy) {
        // Check if player is jumping on enemy
        if (player.body.velocity.y > 0 && player.y < enemy.y - 20) {
            // Kill enemy
            enemy.destroy();
            this.score += 20;
            this.updateUI();
            
            // Bounce player
            player.body.setVelocityY(-300);
            
            // Visual feedback
            const text = this.add.text(enemy.x, enemy.y - 30, '+20', {
                fontSize: '24px',
                fill: '#00ff00',
                fontStyle: 'bold'
            });
            this.tweens.add({
                targets: text,
                y: text.y - 50,
                alpha: 0,
                duration: 800,
                onComplete: () => text.destroy()
            });
        } else {
            // Player takes damage
            this.loseLife();
        }
    }

    loseLife() {
        this.lives--;
        this.updateUI();
        
        // Visual feedback
        this.cameras.main.shake(200);
        this.player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            this.player.clearTint();
        });

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset player position
            this.player.setPosition(100, 450);
            this.player.body.setVelocity(0, 0);
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);
        document.getElementById('final-score').textContent = this.score;
        this.gameOverOverlay.style.display = 'block';
    }

    restartGame() {
        this.scene.restart();
        this.gameOverOverlay.style.display = 'none';
        this.score = 0;
        this.lives = 3;
        this.coinsCollected = 0;
        this.isGameOver = false;
        this.updateUI();
        this.physics.resume();
    }

    showVictoryMessage() {
        const victoryText = this.add.text(600, 300, '🎉 VICTORY! 🎉', {
            fontSize: '64px',
            fill: '#ffd700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: victoryText,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    updateUI() {
        if (this.scoreText) {
            this.scoreText.textContent = this.score;
        }
        if (this.livesText) {
            this.livesText.textContent = this.lives;
        }
    }

    update() {
        if (this.isGameOver) return;

        // Player movement
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-200);
            this.player.setFlipX(true);
            this.player.anims.play('run', true);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(200);
            this.player.setFlipX(false);
            this.player.anims.play('run', true);
        } else {
            this.player.body.setVelocityX(0);
            this.player.anims.play('idle', true);
        }

        // Jump
        if (this.cursors.up.isDown && this.jumpCount < this.maxJumps) {
            this.player.body.setVelocityY(-400);
            this.jumpCount++;
            this.player.anims.play('jump', true);
        }

        // Reset jump count when on ground
        if (this.player.body.touching.down || this.player.body.blocked.down) {
            this.jumpCount = 0;
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }

        // Move enemies
        this.enemies.children.each(enemy => {
            if (enemy.active) {
                // Reverse direction at boundaries
                if (enemy.x < 50 || enemy.x > 1150) {
                    enemy.body.setVelocityX(-enemy.body.velocity.x);
                }
                // Patrol up and down
                if (enemy.y > enemy.patrolY + enemy.patrolRange) {
                    enemy.body.setVelocityY(-50);
                } else if (enemy.y < enemy.patrolY - enemy.patrolRange) {
                    enemy.body.setVelocityY(50);
                }
            }
        });

        // Fall into pit
        if (this.player.y > 700) {
            this.loseLife();
        }
    }
}

// Create the game with custom graphics
class PlatformerGame {
    constructor() {
        const config = {
            type: Phaser.AUTO,
            width: 1200,
            height: 600,
            parent: 'game-container',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 500 },
                    debug: false
                }
            },
            scene: PlatformerScene
        };

        // Create game
        this.game = new Phaser.Game(config);

        // Generate placeholder textures
        this.generateTextures();
    }

    generateTextures() {
        const game = this.game;

        // Player texture (character)
        const playerGraphics = game.textures.generateGraphics('player', '30x40');
        playerGraphics.fill(0x4A90D9);
        // Head
        playerGraphics.fillRect(5, 0, 20, 20);
        playerGraphics.fillStyle(0x2C3E50);
        // Eyes
        playerGraphics.fillRect(8, 5, 4, 4);
        playerGraphics.fillRect(18, 5, 4, 4);
        // Body
        playerGraphics.fillStyle(0x4A90D9);
        playerGraphics.fillRect(3, 20, 24, 15);
        // Arms
        playerGraphics.fillRect(0, 22, 4, 8);
        playerGraphics.fillRect(26, 22, 4, 8);
        // Legs
        playerGraphics.fillRect(6, 35, 6, 5);
        playerGraphics.fillRect(18, 35, 6, 5);
        // Shoes
        playerGraphics.fillStyle(0xE74C3C);
        playerGraphics.fillRect(5, 38, 8, 2);
        playerGraphics.fillRect(17, 38, 8, 2);
        playerGraphics.generate();

        // Enemy texture
        const enemyGraphics = game.textures.generateGraphics('enemy', '30x30');
        enemyGraphics.fill(0xE74C3C);
        // Body
        enemyGraphics.fillRect(2, 2, 26, 26);
        enemyGraphics.fillStyle(0x2C3E50);
        // Eyes
        enemyGraphics.fillRect(7, 8, 5, 5);
        enemyGraphics.fillRect(18, 8, 5, 5);
        // Mouth
        enemyGraphics.fillStyle(0x000000);
        enemyGraphics.fillRect(8, 18, 14, 3);
        // Spikes
        enemyGraphics.fillStyle(0xC0392B);
        for (let i = 0; i < 5; i++) {
            const x = 2 + i * 6;
            enemyGraphics.fillRect(x, 0, 2, 4);
            enemyGraphics.fillRect(x, 26, 2, 4);
        }
        enemyGraphics.generate();

        // Coin texture
        const coinGraphics = game.textures.generateGraphics('coin', '20x20');
        coinGraphics.fill(0xF1C40F);
        coinGraphics.fillCircle(10, 10, 9);
        coinGraphics.fillStyle(0xF39C12);
        coinGraphics.fillCircle(10, 10, 7);
        coinGraphics.fillStyle(0xF1C40F);
        coinGraphics.fillCircle(10, 10, 4);
        coinGraphics.generate();

        // Ground texture
        const groundGraphics = game.textures.generateGraphics('ground', '50x20');
        groundGraphics.fill(0x27AE60);
        groundGraphics.fillRect(0, 0, 50, 20);
        groundGraphics.fillStyle(0x2ECC71);
        groundGraphics.fillRect(0, 0, 50, 3);
        groundGraphics.fillStyle(0x1E8449);
        groundGraphics.fillRect(0, 17, 50, 3);
        // Texture pattern
        for (let i = 0; i < 10; i++) {
            groundGraphics.fillStyle(0x229954);
            groundGraphics.fillRect(i * 5, 6, 2, 2);
            groundGraphics.fillRect(i * 5 + 2, 11, 2, 2);
        }
        groundGraphics.generate();

        // Platform texture
        const platformGraphics = game.textures.generateGraphics('platform', '100x20');
        platformGraphics.fill(0x8B4513);
        platformGraphics.fillRect(0, 0, 100, 20);
        platformGraphics.fillStyle(0xA0522D);
        platformGraphics.fillRect(0, 0, 100, 5);
        platformGraphics.fillStyle(0x6B3410);
        platformGraphics.fillRect(0, 15, 100, 5);
        // Wood grain
        for (let i = 0; i < 20; i++) {
            platformGraphics.fillStyle(0x7B3F15);
            platformGraphics.fillRect(i * 5 + 2, 7, 1, 6);
        }
        platformGraphics.generate();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new PlatformerGame();
});
