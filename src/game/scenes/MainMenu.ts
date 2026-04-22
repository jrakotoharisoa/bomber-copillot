import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const cx = 360;
        const cy = 312;

        // Dark background panel
        this.add.rectangle(cx, cy, 720, 624, 0x1a1a2e);

        // Title
        this.add.text(cx, cy - 100, '💣 BOMBERMAN', {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#ffeb3b',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
        }).setOrigin(0.5);

        // Instructions
        this.add.text(cx, cy, 'Arrows / WASD  —  move\nSPACE  —  place bomb\n\nKill all enemies to win!', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#e0e0e0',
            align: 'center',
            lineSpacing: 8,
        }).setOrigin(0.5);

        // Play button (interactive text)
        const playBtn = this.add.text(cx, cy + 150, '▶  PLAY', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff',
            backgroundColor: '#2e7d32',
            padding: { x: 24, y: 12 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playBtn.on('pointerover', () => playBtn.setStyle({ color: '#ffeb3b' }));
        playBtn.on('pointerout',  () => playBtn.setStyle({ color: '#ffffff' }));
        playBtn.on('pointerdown', () => this.scene.start('Game'));

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('Game');
    }
}

