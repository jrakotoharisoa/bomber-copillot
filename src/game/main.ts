import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

// Canvas matches the tile grid: 15 cols × 48px = 720, 13 rows × 48px = 624
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 720,
    height: 624,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver
    ]
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
