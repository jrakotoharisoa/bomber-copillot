import { Scene } from 'phaser';
import { TILE_SIZE } from './MapGenerator';

export class Player {
    readonly scene: Scene;
    tileX: number;
    tileY: number;
    isMoving: boolean = false;
    alive: boolean = true;

    // Stats
    bombRange: number = 2;
    maxBombs: number = 1;
    activeBombs: number = 0;
    speedBoostActive: boolean = false;

    private sprite: Phaser.GameObjects.Sprite;
    private direction: 'down' | 'up' | 'left' | 'right' = 'down';
    private moveDuration: number = 110; // Base duration in ms

    /** Frame index of the first walk frame per direction. */
    private static readonly DIR_FRAME = { down: 0, up: 2, left: 4, right: 6 } as const;

    constructor(scene: Scene, tileX: number, tileY: number) {
        this.scene = scene;
        this.tileX = tileX;
        this.tileY = tileY;

        this.sprite = scene.add.sprite(
            tileX * TILE_SIZE + TILE_SIZE / 2,
            tileY * TILE_SIZE + TILE_SIZE / 2,
            'player',
            0
        ).setDepth(10);
    }

    moveTo(tileX: number, tileY: number): void {
        const dx = tileX - this.tileX;
        const dy = tileY - this.tileY;

        if      (dy > 0) this.direction = 'down';
        else if (dy < 0) this.direction = 'up';
        else if (dx < 0) this.direction = 'left';
        else             this.direction = 'right';

        this.sprite.play(`player-walk-${this.direction}`, true);

        this.tileX = tileX;
        this.tileY = tileY;
        this.isMoving = true;

        // Reduce duration by 40% when speed boost is active
        const duration = this.speedBoostActive ? this.moveDuration * 0.6 : this.moveDuration;

        this.scene.tweens.add({
            targets: this.sprite,
            x: tileX * TILE_SIZE + TILE_SIZE / 2,
            y: tileY * TILE_SIZE + TILE_SIZE / 2,
            duration,
            onComplete: () => {
                this.isMoving = false;
                this.sprite.setFrame(Player.DIR_FRAME[this.direction]);
            },
        });
    }

    die(): void {
        if (!this.alive) return;
        this.alive = false;

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 400,
            onComplete: () => this.sprite.destroy(),
        });
    }
}
