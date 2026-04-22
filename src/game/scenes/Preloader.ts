import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        // Loading bar background
        this.add.rectangle(360, 312, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(360 - 230, 312, 4, 28, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload ()
    {
        // No external assets needed — graphics are drawn procedurally
        this.load.setPath('assets');
    }

    create ()
    {
        this.scene.start('MainMenu');
    }
}
