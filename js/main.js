// main.js — Game loop, state machine, input handling

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W      = canvas.width;
const H      = canvas.height;

// ─── State ────────────────────────────────────────────────────────────────────
const STATE = { MENU: 'menu', PLAYING: 'playing', LEVEL_COMPLETE: 'lc', GAME_OVER: 'go' };
let state     = STATE.MENU;
let stateTime = 0;

// ─── Game objects ────────────────────────────────────────────────────────────
let player, bullets, enemies, particles;
let currentLevel   = 1;
let score          = 0;
let totalEnemies   = 0;
let enemiesKilled  = 0;
let enemiesSpawned = 0;
let spawnTimer     = 0;
let levelConfig    = null;
let isNewHigh      = false;
let highScore      = parseInt(localStorage.getItem('deadzone_hs') || '0');

// Menu background
let menuEnemies    = [];
let menuSpawnTimer = 0;

// ─── Input ───────────────────────────────────────────────────────────────────
const input = {
  up: false, down: false, left: false, right: false,
  mouseX: W / 2, mouseY: H / 2,
  mouseDown: false
};

window.addEventListener('keydown', e => {
  switch (e.code) {
    case 'ArrowUp':    case 'KeyW': input.up    = true;  e.preventDefault(); break;
    case 'ArrowDown':  case 'KeyS': input.down  = true;  e.preventDefault(); break;
    case 'ArrowLeft':  case 'KeyA': input.left  = true;  e.preventDefault(); break;
    case 'ArrowRight': case 'KeyD': input.right = true;  e.preventDefault(); break;
    case 'Enter': case 'NumpadEnter': handleEnter(); break;
  }
});
window.addEventListener('keyup', e => {
  switch (e.code) {
    case 'ArrowUp':    case 'KeyW': input.up    = false; break;
    case 'ArrowDown':  case 'KeyS': input.down  = false; break;
    case 'ArrowLeft':  case 'KeyA': input.left  = false; break;
    case 'ArrowRight': case 'KeyD': input.right = false; break;
  }
});

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  input.mouseX = (e.clientX - r.left) * (W / r.width);
  input.mouseY = (e.clientY - r.top)  * (H / r.height);
});
canvas.addEventListener('mousedown',  e => { if (e.button === 0) input.mouseDown = true;  });
canvas.addEventListener('mouseup',    e => { if (e.button === 0) input.mouseDown = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ─── State transitions ────────────────────────────────────────────────────────
function handleEnter() {
  switch (state) {
    case STATE.MENU:
      currentLevel = 1;
      score        = 0;
      startLevel();
      break;
    case STATE.LEVEL_COMPLETE:
      currentLevel++;
      startLevel();
      break;
    case STATE.GAME_OVER:
      currentLevel = 1;
      score        = 0;
      startLevel();
      break;
  }
}

function startLevel() {
  levelConfig    = getLevelConfig(currentLevel);
  player         = new Player(W / 2, H / 2);
  bullets        = [];
  enemies        = [];
  particles      = [];
  totalEnemies   = levelConfig.enemyCount;
  enemiesKilled  = 0;
  enemiesSpawned = 0;
  spawnTimer     = 0;   // instant first spawn
  stateTime      = 0;
  state          = STATE.PLAYING;
}

// ─── Spawn helper ────────────────────────────────────────────────────────────
function randomEdgePos() {
  const edge = Math.floor(Math.random() * 4);
  const m    = 35;
  switch (edge) {
    case 0: return { x: Math.random() * W,     y: -m };      // top
    case 1: return { x: Math.random() * W,     y: H + m };   // bottom
    case 2: return { x: -m,                    y: Math.random() * H }; // left
    default:return { x: W + m,                 y: Math.random() * H }; // right
  }
}

function spawnEnemyTick(dt) {
  if (enemiesSpawned >= totalEnemies) return;
  spawnTimer -= dt * 1000;
  if (spawnTimer > 0) return;

  spawnTimer = levelConfig.spawnInterval;
  const types = levelConfig.types;
  const type  = types[Math.floor(Math.random() * types.length)];
  const pos   = randomEdgePos();
  enemies.push(new Enemy(pos.x, pos.y, type, levelConfig.enemySpeed));
  enemiesSpawned++;
}

// ─── Collisions ──────────────────────────────────────────────────────────────
function checkCollisions() {
  // Player bullets → enemies
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    if (b.dead || b.owner !== 'player') continue;

    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (e.dead) continue;

      if (Math.hypot(b.x - e.x, b.y - e.y) < b.radius + e.radius) {
        b.dead = true;
        const killed = e.takeDamage();
        if (killed) {
          score += e.scoreValue;
          enemiesKilled++;
          createExplosion(particles, e.x, e.y, e.color,   14);
          createExplosion(particles, e.x, e.y, '#ffffff',  4);
        }
        break; // bullet consumed
      }
    }
  }

  // Enemy bullets → player
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    if (b.dead || b.owner !== 'enemy') continue;

    if (Math.hypot(b.x - player.x, b.y - player.y) < b.radius + player.radius) {
      b.dead = true;
      if (player.takeDamage()) {
        createBloodSplat(particles, player.x, player.y);
      }
    }
  }

  // Enemies touching player
  for (const e of enemies) {
    if (e.dead) continue;
    if (Math.hypot(e.x - player.x, e.y - player.y) < e.radius + player.radius - 4) {
      if (player.takeDamage()) {
        createBloodSplat(particles, player.x, player.y);
      }
    }
  }
}

// ─── Update ──────────────────────────────────────────────────────────────────
function update(dt) {
  stateTime += dt;

  // Menu background animation
  if (state === STATE.MENU) {
    menuSpawnTimer -= dt;
    if (menuSpawnTimer <= 0 && menuEnemies.length < 9) {
      menuSpawnTimer = 1.2 + Math.random() * 0.8;
      const pos  = randomEdgePos();
      const type = ['grunt', 'charger', 'shooter'][Math.floor(Math.random() * 3)];
      const me   = new Enemy(pos.x, pos.y, type, 42);
      me.hp      = 9999;
      menuEnemies.push(me);
    }
    const dummyBullets = [];
    const dummyPlayer  = { x: W / 2 + (Math.random() - 0.5) * 300,
                           y: H / 2 + (Math.random() - 0.5) * 200 };
    for (let i = menuEnemies.length - 1; i >= 0; i--) {
      const me = menuEnemies[i];
      me.update(dt, dummyPlayer, dummyBullets, W, H);
      // Remove if drifted way off screen
      if (me.x < -80 || me.x > W + 80 || me.y < -80 || me.y > H + 80) {
        menuEnemies.splice(i, 1);
      }
    }
    return;
  }

  if (state !== STATE.PLAYING) return;

  // Player
  player.update(dt, input, W, H);
  if (input.mouseDown) player.tryShoot(bullets, particles);

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update(dt, W, H);
    if (bullets[i].dead) bullets.splice(i, 1);
  }

  // Enemies
  spawnEnemyTick(dt);
  const newBullets = [];
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update(dt, player, newBullets, W, H);
    if (enemies[i].dead) enemies.splice(i, 1);
  }
  bullets.push(...newBullets);

  // Particles
  updateParticles(particles, dt);

  // Collisions
  checkCollisions();

  // Win condition
  if (enemiesKilled >= totalEnemies && enemies.length === 0 && enemiesSpawned >= totalEnemies) {
    state     = STATE.LEVEL_COMPLETE;
    stateTime = 0;
  }

  // Lose condition
  if (player.hp <= 0) {
    isNewHigh = score > highScore;
    if (isNewHigh) {
      highScore = score;
      localStorage.setItem('deadzone_hs', String(highScore));
    }
    state     = STATE.GAME_OVER;
    stateTime = 0;
  }
}

// ─── Render ──────────────────────────────────────────────────────────────────
function render() {
  drawFloor(ctx, W, H);

  if (state === STATE.MENU) {
    for (const me of menuEnemies) drawEnemy(ctx, me);
    drawMenu(ctx, W, H, highScore, stateTime);
    return;
  }

  // Game world
  drawParticles(ctx, particles);
  for (const e of enemies) drawEnemy(ctx, e);
  for (const b of bullets)  drawBullet(ctx, b);
  drawPlayer(ctx, player);

  // Damage screen flash
  if (player.hitFlash > 0) {
    const a = (player.hitFlash / 0.18) * 0.28;
    ctx.fillStyle = `rgba(255,0,0,${a.toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }

  drawHUD(ctx, { player, score, level: currentLevel,
    totalEnemies, enemiesKilled, highScore }, W, H);

  if (state === STATE.LEVEL_COMPLETE) {
    drawLevelComplete(ctx, W, H, currentLevel, score, stateTime);
  }
  if (state === STATE.GAME_OVER) {
    drawGameOver(ctx, W, H, score, highScore, isNewHigh, stateTime);
  }
}

// ─── Game loop ───────────────────────────────────────────────────────────────
let lastTime = 0;
function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05); // cap at 50 ms
  lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
