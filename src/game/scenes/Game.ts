import { Input, Scene, Utils } from 'phaser';
import { EventBus } from '../EventBus';
import {
    generateMap,
    TILE_SIZE, MAP_COLS, MAP_ROWS,
    TILE_FLOOR, TILE_WALL, TILE_BLOCK,
} from '../MapGenerator';
import { Player } from '../Player';
import { Enemy } from '../Enemy';
import { Bomb } from '../Bomb';
import { Bonus } from '../Bonus';
import { BonusType, BONUS_SPAWN_RATE, BONUS_CONFIGS } from '../BonusConfig';

const ENEMY_COUNT = 3;

export class Game extends Scene {
    private map: number[][] = [];
    private player!: Player;
    private enemies: Enemy[] = [];
    private bombs: Bomb[] = [];
    private bonuses: Bonus[] = [];
    // Sprite refs for destructible blocks, indexed [row][col]
    private blockSprites: (Phaser.GameObjects.Image | null)[][] = [];

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };
    private spaceKey!: Phaser.Input.Keyboard.Key;

    private gameActive = false;
    private result: 'win' | 'lose' | null = null;

    // Bonus timer tracking per type
    private bonusTimers: Map<BonusType, Phaser.Time.TimerEvent> = new Map();

    constructor() {
        super('Game');
    }

    create(): void {
        this.map = generateMap();
        this.enemies = [];
        this.bombs = [];
        this.bonuses = [];
        this.result = null;
        this.gameActive = false;
        this.bonusTimers.clear();

        this.buildMap();
        this.spawnPlayer();
        this.spawnEnemies(ENEMY_COUNT);
        this.setupInput();

        // Short delay so first keypress doesn't instantly move
        this.time.delayedCall(300, () => { this.gameActive = true; });

        EventBus.emit('current-scene-ready', this);
    }

    // ─── Map ──────────────────────────────────────────────────────────────────

    private buildMap(): void {
        const mapW = MAP_COLS * TILE_SIZE;
        const mapH = MAP_ROWS * TILE_SIZE;

        // Green floor background
        this.add.rectangle(mapW / 2, mapH / 2, mapW, mapH, 0x5a8a3c);

        for (let row = 0; row < MAP_ROWS; row++) {
            this.blockSprites[row] = [];
            for (let col = 0; col < MAP_COLS; col++) {
                const x = col * TILE_SIZE + TILE_SIZE / 2;
                const y = row * TILE_SIZE + TILE_SIZE / 2;
                const tile = this.map[row][col];

                if (tile === TILE_WALL) {
                    this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x424242).setDepth(1);
                    this.blockSprites[row][col] = null;
                } else if (tile === TILE_BLOCK) {
                    const block = this.add.image(x, y, 'tile-block').setDepth(2);
                    this.blockSprites[row][col] = block;
                } else {
                    this.blockSprites[row][col] = null;
                }
            }
        }
    }

    // ─── Spawning ─────────────────────────────────────────────────────────────

    private spawnPlayer(): void {
        this.player = new Player(this, 1, 1);
    }

    private spawnEnemies(count: number): void {
        const free: { col: number; row: number }[] = [];

        for (let row = 1; row < MAP_ROWS - 1; row++) {
            for (let col = 1; col < MAP_COLS - 1; col++) {
                if (this.map[row][col] === TILE_FLOOR && !(row <= 3 && col <= 3)) {
                    free.push({ col, row });
                }
            }
        }

        Utils.Array.Shuffle(free);

        for (let i = 0; i < Math.min(count, free.length); i++) {
            const { col, row } = free[i];
            this.enemies.push(new Enemy(this, col, row, this.map));
        }
    }

    // ─── Input ────────────────────────────────────────────────────────────────

    private setupInput(): void {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            up:    this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.W),
            down:  this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.S),
            left:  this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.D),
        };
        this.spaceKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.SPACE);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    update(): void {
        if (!this.gameActive || !this.player.alive || this.result !== null) return;

        if (!this.player.isMoving) {
            this.handleMovement();
        }

        if (Input.Keyboard.JustDown(this.spaceKey)) {
            this.placeBomb();
        }

        // Check bonus collisions
        for (const bonus of this.bonuses) {
            if (bonus.checkCollision(this.player)) {
                this.collectBonus(bonus);
            }
        }
    }

    private handleMovement(): void {
        const { up, down, left, right } = this.cursors;
        const w = this.wasd;
        let dx = 0;
        let dy = 0;

        if (up.isDown    || w.up.isDown)    dy = -1;
        else if (down.isDown  || w.down.isDown)  dy = 1;
        else if (left.isDown  || w.left.isDown)  dx = -1;
        else if (right.isDown || w.right.isDown) dx = 1;

        if (dx === 0 && dy === 0) return;

        const nx = this.player.tileX + dx;
        const ny = this.player.tileY + dy;

        if (
            nx >= 0 && ny >= 0 && nx < MAP_COLS && ny < MAP_ROWS &&
            this.map[ny][nx] !== TILE_WALL &&
            this.map[ny][nx] !== TILE_BLOCK &&
            !this.bombs.some(b => b.tileX === nx && b.tileY === ny)
        ) {
            this.player.moveTo(nx, ny);
        }
    }

    // ─── Bombs ────────────────────────────────────────────────────────────────

    private placeBomb(): void {
        const { tileX, tileY } = this.player;

        if (
            this.player.activeBombs >= this.player.maxBombs ||
            this.bombs.some(b => b.tileX === tileX && b.tileY === tileY)
        ) return;

        this.player.activeBombs++;
        const bomb = new Bomb(this, tileX, tileY, this.player.bombRange, (b) => this.explodeBomb(b));
        this.bombs.push(bomb);
    }

    private explodeBomb(bomb: Bomb): void {
        // Remove from active list
        this.bombs = this.bombs.filter(b => b !== bomb);
        this.player.activeBombs = Math.max(0, this.player.activeBombs - 1);

        const hitTiles = this.computeExplosionTiles(bomb);

        // Render explosion flash on each tile
        for (const { x, y } of hitTiles) {
            const rect = this.add.rectangle(
                x * TILE_SIZE + TILE_SIZE / 2,
                y * TILE_SIZE + TILE_SIZE / 2,
                TILE_SIZE,
                TILE_SIZE,
                0xff5722
            ).setDepth(15).setAlpha(0.92);

            this.time.delayedCall(500, () => rect.destroy());
        }

        // Check entities hit
        for (const { x, y } of hitTiles) {
            // Player
            if (this.player.alive && this.player.tileX === x && this.player.tileY === y) {
                this.player.die();
            }

            // Enemies
            for (const enemy of this.enemies) {
                if (enemy.alive && enemy.tileX === x && enemy.tileY === y) {
                    enemy.die();
                }
            }

            // Chain-reaction: trigger other bombs on the exploded tiles
            const chainBombs = this.bombs.filter(b => !b.exploded && b.tileX === x && b.tileY === y);
            for (const cb of chainBombs) {
                cb.triggerEarly((b) => this.explodeBomb(b));
            }
        }

        // Evaluate win/lose shortly after the visual
        this.time.delayedCall(600, () => this.checkWinLose());
    }

    /** Returns all tiles that the explosion reaches, destroying blocks along the way. */
    private computeExplosionTiles(bomb: Bomb): { x: number; y: number }[] {
        const result: { x: number; y: number }[] = [{ x: bomb.tileX, y: bomb.tileY }];
        const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

        for (const { dx, dy } of dirs) {
            for (let i = 1; i <= bomb.range; i++) {
                const nx = bomb.tileX + dx * i;
                const ny = bomb.tileY + dy * i;

                if (nx < 0 || ny < 0 || nx >= MAP_COLS || ny >= MAP_ROWS) break;
                if (this.map[ny][nx] === TILE_WALL) break;

                result.push({ x: nx, y: ny });

                if (this.map[ny][nx] === TILE_BLOCK) {
                    // Remove block from map immediately (collision/explosion logic)
                    this.map[ny][nx] = TILE_FLOOR;
                    const sprite = this.blockSprites[ny][nx];
                    this.blockSprites[ny][nx] = null;

                    // Brick-break visual: scale up and fade out
                    if (sprite) {
                        this.tweens.add({
                            targets: sprite,
                            alpha: 0,
                            scaleX: 1.4,
                            scaleY: 1.4,
                            duration: 220,
                            ease: 'Power2Out',
                            onComplete: () => sprite.destroy(),
                        });
                    }

                    // Maybe spawn a bonus
                    this.maybeSpawnBonus(nx, ny);
                    break; // Explosion doesn't pass through
                }
            }
        }

        return result;
    }

    // ─── Win / Lose ───────────────────────────────────────────────────────────

    private checkWinLose(): void {
        if (this.result !== null) return;

        if (!this.player.alive) {
            this.result = 'lose';
            this.time.delayedCall(1200, () => this.scene.start('GameOver', { result: 'lose' }));
            return;
        }

        if (this.enemies.every(e => !e.alive)) {
            this.result = 'win';
            this.time.delayedCall(1200, () => this.scene.start('GameOver', { result: 'win' }));
        }
    }

    // ─── Bonuses ──────────────────────────────────────────────────────────────

    private maybeSpawnBonus(tileX: number, tileY: number): void {
        if (Math.random() > BONUS_SPAWN_RATE) return;

        const bonusTypes: BonusType[] = ['range', 'bombs', 'speed'];
        const randomType = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
        const bonus = new Bonus(this, tileX, tileY, randomType);
        this.bonuses.push(bonus);
    }

    private collectBonus(bonus: Bonus): void {
        // Remove from active list
        this.bonuses = this.bonuses.filter(b => b !== bonus);

        // If a bonus of the same type is already active, restart its timer
        if (this.bonusTimers.has(bonus.type)) {
            this.bonusTimers.get(bonus.type)?.remove();
            this.bonusTimers.delete(bonus.type);
        }

        // Apply the bonus effect
        bonus.apply(this.player);

        // Set a timer to restore the bonus effect
        const config = BONUS_CONFIGS[bonus.type];
        const timer = this.time.addEvent({
            delay: config.duration,
            callback: () => {
                bonus.restore(this.player);
                this.bonusTimers.delete(bonus.type);
            },
        });

        this.bonusTimers.set(bonus.type, timer);

        // Destroy the bonus sprite
        bonus.destroy();

        // Visual feedback: pulse the player
        this.tweens.add({
            targets: this.player,
            duration: 200,
            repeat: 1,
            yoyo: true,
            onUpdate: () => {
                // This will be visible if we add player sprite reference
            },
        });
    }
}
