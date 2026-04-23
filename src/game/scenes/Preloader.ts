import { Scene } from 'phaser';

/** Tile & sprite size constants (must match MapGenerator.ts). */
const TILE = 48;
/** Character sprite frame size (square, fits inside one tile with a 2px margin). */
const CHAR = 44;
/** Bomb texture size. */
const BOMB = 40;

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
        // All textures are generated programmatically in create()
    }

    create ()
    {
        this.buildTileTextures();
        this.buildCharTexture('player', '#1e88e5', '#64b5f6');
        this.buildCharTexture('enemy',  '#c62828', '#ef9a9a');
        this.buildBombTexture();
        this.scene.start('MainMenu');
    }

    // ─── Tile Textures ────────────────────────────────────────────────────────

    private buildTileTextures (): void
    {
        // Floor
        const floor = this.textures.createCanvas('tile-floor', TILE, TILE)!;
        const fc = floor.getContext();
        fc.fillStyle = '#5a8a3c';
        fc.fillRect(0, 0, TILE, TILE);
        fc.fillStyle = '#4e7a32';
        fc.fillRect(0, 0, TILE, 1);
        fc.fillRect(0, 0, 1, TILE);
        fc.fillStyle = 'rgba(0,0,0,0.08)';
        for (let i = 16; i < TILE; i += 16)
        {
            fc.fillRect(i, 0, 1, TILE);
            fc.fillRect(0, i, TILE, 1);
        }
        floor.refresh();

        // Wall
        const wall = this.textures.createCanvas('tile-wall', TILE, TILE)!;
        const wc = wall.getContext();
        wc.fillStyle = '#263238';
        wc.fillRect(0, 0, TILE, TILE);
        wc.fillStyle = '#455a64';
        wc.fillRect(3, 3, TILE - 6, TILE - 6);
        wc.fillStyle = 'rgba(255,255,255,0.12)';
        wc.fillRect(3, 3, TILE - 6, 4);
        wc.fillRect(3, 3, 4, TILE - 6);
        wc.fillStyle = 'rgba(0,0,0,0.25)';
        wc.fillRect(3, TILE / 2 - 1, TILE - 6, 2);
        wc.fillRect(TILE / 4, 3, 2, TILE / 2 - 4);
        wc.fillRect(Math.round(TILE * 3 / 4) - 2, TILE / 2 + 1, 2, TILE / 2 - 4);
        wall.refresh();

        // Destructible block (brick wall)
        const block = this.textures.createCanvas('tile-block', TILE, TILE)!;
        const bc = block.getContext();

        // Brick dimensions: 3 rows × 16px (14px brick + 2px mortar), 2 bricks per row × 24px (22px brick + 2px mortar)
        const BRICK_W  = 24; // column pitch (brick + right mortar)
        const BRICK_H  = 16; // row pitch    (brick + bottom mortar)
        const MORTAR   = 2;
        const BRICK_COLORS = ['#b03a2e', '#a93226', '#c0392b'] as const;

        // Mortar background
        bc.fillStyle = '#8d8d8d';
        bc.fillRect(0, 0, TILE, TILE);

        for (let row = 0; row < 3; row++)
        {
            const offsetX = (row % 2 === 0) ? 0 : -(BRICK_W / 2);
            const by      = row * BRICK_H;
            const bh      = BRICK_H - MORTAR;

            for (let col = -1; col < 3; col++)
            {
                const bx       = offsetX + col * BRICK_W;
                const bw       = BRICK_W - MORTAR;
                const clipLeft = Math.max(bx, 0);
                const clipW    = Math.min(bx + bw, TILE) - clipLeft;

                if (clipW <= 0) continue;

                // Base brick color (slight variation per brick)
                bc.fillStyle = BRICK_COLORS[(row + col + 3) % BRICK_COLORS.length];
                bc.fillRect(clipLeft, by, clipW, bh);

                // Top highlight
                bc.fillStyle = 'rgba(255,255,255,0.22)';
                bc.fillRect(clipLeft, by, clipW, 2);

                // Left highlight (only when the left edge is not clipped)
                if (bx >= 0)
                {
                    bc.fillRect(bx, by, 2, bh);
                }

                // Bottom shadow
                bc.fillStyle = 'rgba(0,0,0,0.28)';
                bc.fillRect(clipLeft, by + bh - 2, clipW, 2);
            }
        }

        // Overall border shadow to give depth
        bc.strokeStyle = 'rgba(0,0,0,0.45)';
        bc.lineWidth   = 2;
        bc.strokeRect(1, 1, TILE - 2, TILE - 2);

        block.refresh();

        // Explosion overlay
        const expl = this.textures.createCanvas('tile-explosion', TILE, TILE)!;
        const ec = expl.getContext();
        const grad = ec.createRadialGradient(TILE / 2, TILE / 2, 2, TILE / 2, TILE / 2, TILE / 2 - 1);
        grad.addColorStop(0,   '#fffde7');
        grad.addColorStop(0.3, '#ffcc02');
        grad.addColorStop(0.6, '#ff6d00');
        grad.addColorStop(1,   'rgba(255,109,0,0)');
        ec.fillStyle = grad;
        ec.fillRect(0, 0, TILE, TILE);
        expl.refresh();
    }

    // ─── Character Textures ───────────────────────────────────────────────────

    /**
     * Builds an 8-frame spritesheet for a character.
     * Frame layout: [down-0, down-1, up-0, up-1, left-0, left-1, right-0, right-1]
     */
    private buildCharTexture (key: string, bodyColor: string, headColor: string): void
    {
        const DIRS = ['down', 'up', 'left', 'right'] as const;
        const FCOUNT = 2;
        const ct = this.textures.createCanvas(key, DIRS.length * FCOUNT * CHAR, CHAR)!;
        const ctx = ct.getContext();

        DIRS.forEach((dir, di) =>
        {
            for (let f = 0; f < FCOUNT; f++)
            {
                this.drawChar(ctx, (di * FCOUNT + f) * CHAR, bodyColor, headColor, dir, f);
            }
        });

        ct.refresh();

        // Register numbered frames so anims can reference them
        const tex = this.textures.get(key);
        DIRS.forEach((_, di) =>
        {
            for (let f = 0; f < FCOUNT; f++)
            {
                const idx = di * FCOUNT + f;
                tex.add(idx, 0, idx * CHAR, 0, CHAR, CHAR);
            }
        });
    }

    private drawChar (
        ctx: CanvasRenderingContext2D,
        ox: number,
        bodyColor: string,
        headColor: string,
        dir: 'down' | 'up' | 'left' | 'right',
        frame: number,
    ): void
    {
        const cx      = ox + CHAR / 2;
        const bob     = frame === 1 ? 1 : 0;
        const bodyCy  = CHAR / 2 + 4 + bob;
        const headR   = 9;

        const headOffset = { down: { x: 0, y: -10 }, up: { x: 0, y: -14 }, left: { x: -5, y: -11 }, right: { x: 5, y: -11 } };
        const ho = headOffset[dir];
        const hx = cx + ho.x;
        const hy = bodyCy + ho.y + bob;

        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(cx, bodyCy + 11, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(cx, bodyCy, 12, 0, Math.PI * 2);
        ctx.fill();

        // Body shine
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath();
        ctx.arc(cx - 4, bodyCy - 4, 5, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.arc(hx, hy, headR, 0, Math.PI * 2);
        ctx.fill();

        // Head shine
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(hx - 3, hy - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (not visible from behind)
        if (dir === 'up') return;

        let e1x: number, e1y: number, e2x: number, e2y: number;
        if (dir === 'down')
        {
            e1x = hx - 3; e1y = hy + 3;
            e2x = hx + 3; e2y = hy + 3;
        }
        else if (dir === 'left')
        {
            e1x = hx - 4; e1y = hy - 2;
            e2x = hx - 4; e2y = hy + 2;
        }
        else
        {
            e1x = hx + 4; e1y = hy - 2;
            e2x = hx + 4; e2y = hy + 2;
        }

        // Whites
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(e1x, e1y, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x, e2y, 2.5, 0, Math.PI * 2); ctx.fill();

        // Pupils
        const px = dir === 'left' ? -0.8 : dir === 'right' ? 0.8 : 0;
        const py = dir === 'down' ? 0.8 : 0;
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.arc(e1x + px, e1y + py, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x + px, e2y + py, 1.2, 0, Math.PI * 2); ctx.fill();
    }

    // ─── Bomb Texture ─────────────────────────────────────────────────────────

    private buildBombTexture (): void
    {
        const ct  = this.textures.createCanvas('bomb', BOMB, BOMB)!;
        const ctx = ct.getContext();
        const cx  = BOMB / 2;
        const cy  = BOMB / 2 + 4;   // center slightly below mid to leave room for fuse

        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 9, 9, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fill();

        // Body shine
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Fuse
        ctx.strokeStyle = '#a1887f';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy - 10);
        ctx.bezierCurveTo(cx + 10, cy - 14, cx + 4, cy - 18, cx + 6, cy - 20);
        ctx.stroke();

        // Spark
        ctx.fillStyle = '#fff59d';
        ctx.beginPath();
        ctx.arc(cx + 6, cy - 20, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffca28';
        ctx.beginPath();
        ctx.arc(cx + 6, cy - 20, 2, 0, Math.PI * 2);
        ctx.fill();

        ct.refresh();
    }
}
