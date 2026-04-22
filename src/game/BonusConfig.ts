export type BonusType = 'range' | 'bombs' | 'speed';

export interface BonusConfig {
    readonly type: BonusType;
    readonly color: number;
    readonly duration: number; // milliseconds
    readonly description: string;
}

export const BONUS_CONFIGS: Record<BonusType, BonusConfig> = {
    range: {
        type: 'range',
        color: 0xFFC107, // Amber
        duration: 6000,
        description: 'Range +1',
    },
    bombs: {
        type: 'bombs',
        color: 0x2196F3, // Blue
        duration: 8000,
        description: 'Extra Bomb',
    },
    speed: {
        type: 'speed',
        color: 0x4CAF50, // Green
        duration: 7000,
        description: 'Speed Boost',
    },
};

export const BONUS_SPAWN_RATE = 0.35; // 35% chance when a block is destroyed
