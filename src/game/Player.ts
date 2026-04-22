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

    private sprite: Phaser.GameObjects.Rectangle;

    constructor(scene: Scene, tileX: number, tileY: number) {
        this.scene = scene;
        this.tileX = tileX;
        this.tileY = tileY;

        this.sprite = scene.add.rectangle(
            tileX * TILE_SIZE + TILE_SIZE / 2,
            tileY * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE - 6,
            TILE_SIZE - 6,
            0x2196f3
        ).setDepth(10);
    }

    moveTo(tileX: number, tileY: number): void {
        this.tileX = tileX;
        this.tileY = tileY;
        this.isMoving = true;

        this.scene.tweens.add({
            targets: this.sprite,
            x: tileX * TILE_SIZE + TILE_SIZE / 2,
            y: tileY * TILE_SIZE + TILE_SIZE / 2,
            duration: 110,
            onComplete: () => { this.isMoving = false; },
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
