import { Scene } from 'phaser';
import { TILE_SIZE } from './MapGenerator';

export class Bomb {
    readonly tileX: number;
    readonly tileY: number;
    readonly range: number;
    exploded: boolean = false;

    private sprite: Phaser.GameObjects.Sprite;
    private timer: Phaser.Time.TimerEvent;
    private pulseTween: Phaser.Tweens.Tween;

    constructor(
        scene: Scene,
        tileX: number,
        tileY: number,
        range: number,
        onExplode: (bomb: Bomb) => void
    ) {
        this.tileX = tileX;
        this.tileY = tileY;
        this.range = range;

        this.sprite = scene.add.sprite(
            tileX * TILE_SIZE + TILE_SIZE / 2,
            tileY * TILE_SIZE + TILE_SIZE / 2,
            'bomb'
        ).setDepth(8);

        // Pulse animation to show it's about to explode
        this.pulseTween = scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.25,
            scaleY: 1.25,
            yoyo: true,
            repeat: -1,
            duration: 350,
        });

        this.timer = scene.time.addEvent({
            delay: 3000,
            callback: () => this.explode(onExplode),
        });
    }

    /** Trigger early (chain reaction). */
    triggerEarly(onExplode: (bomb: Bomb) => void): void {
        if (this.exploded) return;
        this.timer.remove();
        this.explode(onExplode);
    }

    private explode(onExplode: (bomb: Bomb) => void): void {
        if (this.exploded) return;
        this.exploded = true;
        this.pulseTween.stop();
        this.sprite.destroy();
        onExplode(this);
    }
}
