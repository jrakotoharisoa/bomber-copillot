export const TILE_SIZE = 48;
export const MAP_COLS = 15;
export const MAP_ROWS = 13;

export const TILE_FLOOR = 0;
export const TILE_WALL  = 1; // indestructible
export const TILE_BLOCK = 2; // destructible

// Safe zone around each corner spawn (col, row offsets from corner)
const SAFE_OFFSETS = [
    [0, 0], [1, 0], [0, 1],
];

function isSafe(col: number, row: number, spawnCol: number, spawnRow: number): boolean {
    return SAFE_OFFSETS.some(([dc, dr]) => col === spawnCol + dc && row === spawnRow + dr);
}

export function generateMap(): number[][] {
    const map: number[][] = [];

    for (let row = 0; row < MAP_ROWS; row++) {
        map[row] = [];
        for (let col = 0; col < MAP_COLS; col++) {
            // Outer border = indestructible wall
            if (row === 0 || row === MAP_ROWS - 1 || col === 0 || col === MAP_COLS - 1) {
                map[row][col] = TILE_WALL;
            // Interior pillars at even row+col positions
            } else if (row % 2 === 0 && col % 2 === 0) {
                map[row][col] = TILE_WALL;
            } else {
                map[row][col] = TILE_FLOOR;
            }
        }
    }

    // Player spawns at top-left (1,1); enemies spawn near bottom-right area
    const playerSpawn = { col: 1, row: 1 };

    // Randomly fill ~60% of remaining floor tiles with destructible blocks
    for (let row = 1; row < MAP_ROWS - 1; row++) {
        for (let col = 1; col < MAP_COLS - 1; col++) {
            if (map[row][col] !== TILE_FLOOR) continue;
            if (isSafe(col, row, playerSpawn.col, playerSpawn.row)) continue;
            if (Math.random() < 0.60) {
                map[row][col] = TILE_BLOCK;
            }
        }
    }

    return map;
}
