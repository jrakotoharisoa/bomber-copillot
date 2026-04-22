import { Scene, Utils } from 'phaser';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, TILE_FLOOR } from './MapGenerator';

const MOVE_DELAY = 800; // ms between AI moves

export class Enemy {
    tileX: number;
    tileY: number;
    alive: boolean = true;

    private scene: Scene;
    private map: number[][];
    private sprite: Phaser.GameObjects.Rectangle;
    private moveTimer: Phaser.Time.TimerEvent;

    constructor(scene: Scene, tileX: number, tileY: number, map: number[][]) {
        this.scene = scene;
        this.tileX = tileX;
        this.tileY = tileY;
        this.map = map;

        this.sprite = scene.add.rectangle(
            tileX * TILE_SIZE + TILE_SIZE / 2,
            tileY * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE - 6,
            TILE_SIZE - 6,
            0xf44336
        ).setDepth(10);

        this.moveTimer = scene.time.addEvent({
            delay: MOVE_DELAY,
            loop: true,
            callback: this.tryMove,
            callbackScope: this,
        });
    }

    die(): void {
        if (!this.alive) return;
        this.alive = false;
        this.moveTimer.remove();

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 350,
            onComplete: () => this.sprite.destroy(),
        });
    }

    private tryMove(): void {
        if (!this.alive) return;

        const dirs = [
            { dx: 0, dy: -1 },
            { dx: 0, dy:  1 },
            { dx: -1, dy: 0 },
            { dx:  1, dy: 0 },
        ];

        // Shuffle to get random direction priority
        Utils.Array.Shuffle(dirs);

        for (const { dx, dy } of dirs) {
            const nx = this.tileX + dx;
            const ny = this.tileY + dy;

            if (
                nx >= 0 && ny >= 0 &&
                nx < MAP_COLS && ny < MAP_ROWS &&
                this.map[ny][nx] === TILE_FLOOR
            ) {
                this.tileX = nx;
                this.tileY = ny;

                this.scene.tweens.add({
                    targets: this.sprite,
                    x: nx * TILE_SIZE + TILE_SIZE / 2,
                    y: ny * TILE_SIZE + TILE_SIZE / 2,
                    duration: 200,
                });
                break;
            }
        }
    }
}
