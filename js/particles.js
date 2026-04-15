// particles.js — Particle system

class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size || 3;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.88, dt * 60);
    this.vy *= Math.pow(0.88, dt * 60);
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(
      Math.round(this.x - this.size / 2),
      Math.round(this.y - this.size / 2),
      this.size,
      this.size
    );
    ctx.globalAlpha = 1;
  }
}

function createExplosion(particles, x, y, color, count) {
  count = count || 10;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 150;
    const size = 2 + Math.floor(Math.random() * 4);
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      0.25 + Math.random() * 0.5,
      size
    ));
  }
}

function createMuzzleFlash(particles, x, y, angle) {
  for (let i = 0; i < 5; i++) {
    const spread = (Math.random() - 0.5) * 0.9;
    const a = angle + spread;
    const speed = 90 + Math.random() * 120;
    particles.push(new Particle(
      x, y,
      Math.cos(a) * speed,
      Math.sin(a) * speed,
      i % 2 === 0 ? '#ffee44' : '#ffffff',
      0.08 + Math.random() * 0.08,
      2
    ));
  }
}

function createBloodSplat(particles, x, y) {
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 80;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      '#ff2222',
      0.4 + Math.random() * 0.4,
      3
    ));
  }
}

function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update(dt);
    if (particles[i].dead) particles.splice(i, 1);
  }
}

function drawParticles(ctx, particles) {
  for (const p of particles) p.draw(ctx);
}
