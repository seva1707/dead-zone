// entities.js — Player, Bullet, Enemy classes

const PLAYER_MAX_SPEED = 210;
const PLAYER_FRICTION  = 0.86;
const BULLET_SPEED     = 520;
const ENEMY_BULLET_SPD = 190;
const PLAYER_FIRE_RATE = 0.14; // seconds between shots
const PLAYER_RADIUS    = 14;
const BULLET_RADIUS    = 4;

// ─── Player ──────────────────────────────────────────────────────────────────
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;         // toward mouse
    this.hp = 3;
    this.maxHp = 3;
    this.fireCooldown = 0;
    this.invincible = 0;    // seconds of invincibility after hit
    this.hitFlash = 0;      // screen flash timer
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.isMoving = false;
    this.radius = PLAYER_RADIUS;
  }

  update(dt, input, W, H) {
    // Direction from keys
    let dx = 0, dy = 0;
    if (input.left)  dx -= 1;
    if (input.right) dx += 1;
    if (input.up)    dy -= 1;
    if (input.down)  dy += 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

    // Accelerate
    const accel = 1400;
    this.vx += dx * accel * dt;
    this.vy += dy * accel * dt;

    // Friction (frame-rate independent)
    const frict = Math.pow(PLAYER_FRICTION, dt * 60);
    this.vx *= frict;
    this.vy *= frict;

    // Cap speed
    const spd = Math.hypot(this.vx, this.vy);
    if (spd > PLAYER_MAX_SPEED) {
      this.vx = (this.vx / spd) * PLAYER_MAX_SPEED;
      this.vy = (this.vy / spd) * PLAYER_MAX_SPEED;
    }

    this.isMoving = spd > 12;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Clamp to canvas
    this.x = Math.max(this.radius, Math.min(W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(H - this.radius, this.y));

    // Walk animation
    if (this.isMoving) {
      this.walkTimer += dt;
      if (this.walkTimer > 0.1) {
        this.walkFrame = (this.walkFrame + 1) % 4;
        this.walkTimer = 0;
      }
    }

    // Aim toward mouse
    this.angle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);

    // Timers
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.invincible   > 0) this.invincible   -= dt;
    if (this.hitFlash     > 0) this.hitFlash     -= dt;
  }

  tryShoot(bullets, particles) {
    if (this.fireCooldown > 0) return false;
    this.fireCooldown = PLAYER_FIRE_RATE;

    // Gun tip in world space
    const gunLen = 22;
    const gx = this.x + Math.cos(this.angle) * gunLen;
    const gy = this.y + Math.sin(this.angle) * gunLen;

    bullets.push(new Bullet(gx, gy, this.angle, 'player'));
    createMuzzleFlash(particles, gx, gy, this.angle);
    return true;
  }

  takeDamage() {
    if (this.invincible > 0) return false;
    this.hp       -= 1;
    this.invincible = 1.5;
    this.hitFlash   = 0.18;
    return true;
  }
}

// ─── Bullet ──────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle, owner) {
    this.x     = x;
    this.y     = y;
    const spd  = owner === 'player' ? BULLET_SPEED : ENEMY_BULLET_SPD;
    this.vx    = Math.cos(angle) * spd;
    this.vy    = Math.sin(angle) * spd;
    this.owner  = owner;
    this.radius = owner === 'player' ? BULLET_RADIUS : 5;
    this.angle  = angle;
    this.dead   = false;
  }

  update(dt, W, H) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -30 || this.x > W + 30 || this.y < -30 || this.y > H + 30) {
      this.dead = true;
    }
  }
}

// ─── Enemy ───────────────────────────────────────────────────────────────────
class Enemy {
  constructor(x, y, type, speed) {
    this.x     = x;
    this.y     = y;
    this.type  = type;
    this.speed = speed;
    this.vx    = 0;
    this.vy    = 0;
    this.angle = 0;   // direction toward player
    this.dead  = false;
    this.hitFlash = 0;

    switch (type) {
      case 'grunt':
        this.hp = 2; this.maxHp = 2;
        this.radius = 14; this.color = '#cc2222';
        this.scoreValue = 10;
        break;
      case 'charger':
        this.hp = 3; this.maxHp = 3;
        this.radius = 13; this.color = '#dd6600';
        this.scoreValue = 20;
        this.charging      = false;
        this.chargeTimer   = 0;
        this.chargeCooldown = 1.5 + Math.random();
        this.chargeVx      = 0;
        this.chargeVy      = 0;
        break;
      case 'shooter':
        this.hp = 2; this.maxHp = 2;
        this.radius = 13; this.color = '#7733bb';
        this.scoreValue = 30;
        this.fireCooldown = 1.5 + Math.random() * 1.5;
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
        break;
      case 'boss':
        this.hp = 40; this.maxHp = 40;
        this.radius = 30; this.color = '#aa0000';
        this.scoreValue = 500;
        this.fireCooldown = 1.2;
        break;
    }
  }

  update(dt, player, outBullets, W, H) {
    const dx   = player.x - this.x;
    const dy   = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.angle = Math.atan2(dy, dx);

    if (this.hitFlash > 0) this.hitFlash -= dt;

    switch (this.type) {
      case 'grunt': {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
        break;
      }

      case 'charger': {
        this.chargeCooldown -= dt;
        if (this.charging) {
          // Hold charge velocity
          this.chargeTimer -= dt;
          if (this.chargeTimer <= 0) {
            this.charging = false;
            this.chargeCooldown = 1.8 + Math.random() * 0.8;
          }
          // Slight deceleration during charge
          this.vx *= Math.pow(0.96, dt * 60);
          this.vy *= Math.pow(0.96, dt * 60);
        } else {
          // Walk toward player slowly
          this.vx = (dx / dist) * this.speed * 0.45;
          this.vy = (dy / dist) * this.speed * 0.45;
          // Start charge
          if (this.chargeCooldown <= 0 && dist < 420) {
            this.charging = true;
            this.chargeTimer = 0.38;
            const cspd = this.speed * 4.5;
            this.vx = (dx / dist) * cspd;
            this.vy = (dy / dist) * cspd;
          }
        }
        break;
      }

      case 'shooter': {
        const preferred = 195;
        if (dist > preferred + 25) {
          // Move closer
          this.vx = (dx / dist) * this.speed * 0.65;
          this.vy = (dy / dist) * this.speed * 0.65;
        } else if (dist < preferred - 25) {
          // Back away
          this.vx = -(dx / dist) * this.speed * 0.65;
          this.vy = -(dy / dist) * this.speed * 0.65;
        } else {
          // Strafe perpendicular
          this.vx = (-dy / dist) * this.speed * 0.5 * this.strafeDir;
          this.vy = ( dx / dist) * this.speed * 0.5 * this.strafeDir;
        }
        // Shoot at player
        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0) {
          this.fireCooldown = 2.0 + Math.random() * 1.5;
          outBullets.push(new Bullet(this.x, this.y, this.angle, 'enemy'));
        }
        break;
      }

      case 'boss': {
        // Walk toward player
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
        // Shoot spread
        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0) {
          this.fireCooldown = 1.2;
          for (let s = -2; s <= 2; s++) {
            outBullets.push(new Bullet(this.x, this.y, this.angle + s * 0.22, 'enemy'));
          }
        }
        break;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Keep inside canvas (enemies can spawn from edges so clamp loosely)
    this.x = Math.max(-this.radius, Math.min(W + this.radius, this.x));
    this.y = Math.max(-this.radius, Math.min(H + this.radius, this.y));
  }

  takeDamage(amount) {
    amount = amount || 1;
    this.hp -= amount;
    this.hitFlash = 0.1;
    if (this.hp <= 0) { this.dead = true; return true; }
    return false;
  }
}
