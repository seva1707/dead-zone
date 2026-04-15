# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Open `index.html` directly in a browser — no build step, no server required. All scripts are loaded via `<script src="...">` tags in dependency order.

For local development with live reload, any static file server works:
```bash
npx serve .
# or
python -m http.server 8080
```

## Git Workflow

After every meaningful change: commit locally and push to GitHub.
```bash
git add <files>
git commit -m "descriptive message"
git push
```

The GitHub remote is `https://github.com/seva1707/dead-zone` (origin/master).

## Architecture

The game runs entirely in a single `requestAnimationFrame` loop (`main.js`). There is **no module system** — all files share a single global scope and must be loaded in this order:

```
levels.js → particles.js → entities.js → renderer.js → main.js
```

### Data flow each frame

```
loop(ts)
  update(dt)
    player.update()          ← reads input object, writes player state
    player.tryShoot()        ← pushes Bullet + particles
    spawnEnemyTick()         ← pushes Enemy based on spawnTimer
    enemy.update()           ← pushes outBullets (enemy fire)
    checkCollisions()        ← marks .dead, increments score/enemiesKilled
    win/lose check           ← transitions state
  render()
    drawFloor / drawParticles / drawEnemy / drawBullet / drawPlayer / drawHUD
    drawLevelComplete / drawGameOver overlays
```

### State machine (`main.js`)

Four states: `MENU → PLAYING → LEVEL_COMPLETE → PLAYING` (or `GAME_OVER → MENU`). `Enter` drives all transitions via `handleEnter()`. `stateTime` resets to 0 on every transition and drives blinking text / overlays in the renderer.

### Key design patterns

- **Dead flag**: entities are marked `entity.dead = true` then spliced out on the next iteration. Never remove mid-loop.
- **Enemy bullets buffered**: `enemy.update()` receives an `outBullets` array it pushes into; `main.js` spreads that into the main `bullets` array after the enemy loop. This prevents newly spawned enemy bullets from being collision-checked in the same frame they were created.
- **Frame-rate independence**: all velocity and friction use `dt` (seconds). Friction is applied as `Math.pow(FRICTION, dt * 60)` to stay consistent across frame rates. `dt` is capped at 50 ms to prevent tunnelling on tab switch.
- **Sprites are procedural**: everything is drawn with `ctx.arc` / `ctx.fillRect` / `ctx.beginPath` in `renderer.js`. No image assets.

### Adding a new enemy type

1. Add a `case 'typename':` block in `Enemy` constructor (`entities.js`) — set `hp`, `radius`, `color`, `scoreValue`, and any type-specific state.
2. Add a `case 'typename':` block in `Enemy.update()` for movement/shooting logic.
3. Add a `case 'typename':` block in `drawEnemy()` (`renderer.js`) for visuals.
4. Reference the type string in a level config in `LEVELS` array (`levels.js`).

### Tuning constants (`entities.js` top)

| Constant | Effect |
|---|---|
| `PLAYER_MAX_SPEED` | Top movement speed (px/s) |
| `PLAYER_FRICTION` | How quickly the player decelerates (lower = slidier) |
| `PLAYER_FIRE_RATE` | Seconds between shots |
| `BULLET_SPEED` / `ENEMY_BULLET_SPD` | Projectile speeds (px/s) |

### Persistence

Only `highScore` is persisted, via `localStorage` key `deadzone_hs`.
