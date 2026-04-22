import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create (data: { result?: 'win' | 'lose' })
    {
        const win = data?.result === 'win';
        const cx = 360;
        const cy = 312;

        this.add.rectangle(cx, cy, 720, 624, win ? 0x1b5e20 : 0x7f0000);

        this.add.text(cx, cy - 80, win ? '🏆 VICTOIRE !' : '💀 GAME OVER', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center',
        }).setOrigin(0.5);

        this.add.text(cx, cy, win ? 'Tous les ennemis ont été éliminés !' : 'Vous avez été touché par une explosion.', {
            fontFamily: 'Arial',
            fontSize: 22,
            color: '#e0e0e0',
            align: 'center',
        }).setOrigin(0.5);

        // Replay button
        const btn = this.add.text(cx, cy + 110, '🔄  REJOUER', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            backgroundColor: '#1565c0',
            padding: { x: 24, y: 12 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ color: '#ffeb3b' }));
        btn.on('pointerout',  () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerdown', () => this.scene.start('MainMenu'));

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}

