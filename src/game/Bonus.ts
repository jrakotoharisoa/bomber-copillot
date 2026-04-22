import { Scene } from 'phaser';
import { TILE_SIZE } from './MapGenerator';
import { BonusType, BONUS_CONFIGS } from './BonusConfig';
import { Player } from './Player';

export class Bonus {
    readonly type: BonusType;
    readonly tileX: number;
    readonly tileY: number;

    private sprite: Phaser.GameObjects.Rectangle;
    private pulseTween: Phaser.Tweens.Tween;

    constructor(scene: Scene, tileX: number, tileY: number, type: BonusType) {
        this.tileX = tileX;
        this.tileY = tileY;
        this.type = type;

        const config = BONUS_CONFIGS[type];
        const x = tileX * TILE_SIZE + TILE_SIZE / 2;
        const y = tileY * TILE_SIZE + TILE_SIZE / 2;

        this.sprite = scene.add.rectangle(x, y, TILE_SIZE - 8, TILE_SIZE - 8, config.color)
            .setDepth(5)
            .setAlpha(0.8);

        // Pulse animation to attract attention
        this.pulseTween = scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.15,
            scaleY: 1.15,
            yoyo: true,
            repeat: -1,
            duration: 400,
        });
    }

    /**
     * Check if player is on this bonus tile and collect it.
     */
    checkCollision(player: Player): boolean {
        return player.tileX === this.tileX && player.tileY === this.tileY;
    }

    /**
     * Apply the bonus effect to the player.
     */
    apply(player: Player): void {
        switch (this.type) {
            case 'range':
                player.bombRange += 1;
                break;
            case 'bombs':
                player.maxBombs += 1;
                break;
            case 'speed':
                player.speedBoostActive = true;
                break;
        }
    }

    /**
     * Restore the bonus effect (called when timer expires).
     */
    restore(player: Player): void {
        switch (this.type) {
            case 'range':
                player.bombRange -= 1;
                break;
            case 'bombs':
                player.maxBombs -= 1;
                break;
            case 'speed':
                player.speedBoostActive = false;
                break;
        }
    }

    /**
     * Destroy the bonus sprite and animations.
     */
    destroy(): void {
        this.pulseTween.stop();
        this.sprite.destroy();
    }
}
