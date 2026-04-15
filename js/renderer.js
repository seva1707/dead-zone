// renderer.js — All canvas drawing

const TILE = 32;

// ─── Floor ───────────────────────────────────────────────────────────────────
function drawFloor(ctx, W, H) {
  ctx.fillStyle = '#131320';
  ctx.fillRect(0, 0, W, H);

  for (let x = 0; x < W; x += TILE) {
    for (let y = 0; y < H; y += TILE) {
      if ((Math.floor(x / TILE) + Math.floor(y / TILE)) % 2 === 0) {
        ctx.fillStyle = '#161625';
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }

  ctx.strokeStyle = '#1c1c2e';
  ctx.lineWidth = 0.8;
  for (let x = 0; x <= W; x += TILE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += TILE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

// ─── Player ──────────────────────────────────────────────────────────────────
function drawPlayer(ctx, player) {
  // Blink during invincibility
  if (player.invincible > 0 && Math.floor(player.invincible * 9) % 2 === 0) return;

  ctx.save();
  ctx.translate(Math.round(player.x), Math.round(player.y));

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(3, 10, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (animated walk cycle)
  const legPhase = [0, 5, 0, -5][player.walkFrame];
  ctx.fillStyle = '#1e3a18';
  if (player.isMoving) {
    ctx.fillRect(-5, 7,  5, 8);           // left leg
    ctx.fillRect( 1, 7 + legPhase, 5, 8); // right leg
    ctx.fillRect(-5, 7 - legPhase, 5, 8); // left leg animated
  } else {
    ctx.fillRect(-5, 7, 5, 8);
    ctx.fillRect( 1, 7, 5, 8);
  }

  // Body
  const bodyColor = player.hitFlash > 0 ? '#ffffff' : '#3d8a2c';
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(100,200,80,0.45)';
  ctx.beginPath();
  ctx.arc(-4, -4, 6, 0, Math.PI * 2);
  ctx.fill();

  // Dark outline
  ctx.strokeStyle = '#1e3a18';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.stroke();

  // Gun arm (rotated toward mouse)
  ctx.rotate(player.angle);
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(6, -4, 18, 6);   // gun body
  ctx.fillStyle = '#666666';
  ctx.fillRect(20, -3, 8,  4);  // barrel
  ctx.fillStyle = '#333333';
  ctx.fillRect(9,  2,  9,  4);  // grip

  ctx.restore();
}

// ─── Enemy ───────────────────────────────────────────────────────────────────
function drawEnemy(ctx, enemy) {
  ctx.save();
  ctx.translate(Math.round(enemy.x), Math.round(enemy.y));

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(3, enemy.radius - 1, enemy.radius * 0.75, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const col = (enemy.hitFlash > 0) ? '#ffffff' : enemy.color;

  switch (enemy.type) {
    case 'grunt': {
      const s = enemy.radius;
      // Body square
      ctx.fillStyle = col;
      ctx.fillRect(-s, -s, s * 2, s * 2);
      // Side shading
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(-s, s - 4, s * 2, 4);
      ctx.fillRect(s - 4, -s, 4, s * 2);
      // Pixel eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -7, 4, 6);
      ctx.fillRect( 2, -7, 4, 6);
      // Pupils follow player direction
      const px = Math.cos(enemy.angle) * 1.5;
      const py = Math.sin(enemy.angle) * 1.5;
      ctx.fillStyle = '#000000';
      ctx.fillRect(-5 + px, -6 + py, 2, 4);
      ctx.fillRect( 3 + px, -6 + py, 2, 4);
      // Mouth (angry line)
      ctx.fillStyle = '#000000';
      ctx.fillRect(-4, 3, 8, 2);
      break;
    }

    case 'charger': {
      ctx.rotate(enemy.angle);
      const r = enemy.radius;
      // Triangle body
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo( r + 3,  0);
      ctx.lineTo(-r,     -r * 0.82);
      ctx.lineTo(-r,      r * 0.82);
      ctx.closePath();
      ctx.fill();
      // Inner highlight
      ctx.fillStyle = 'rgba(255,210,80,0.4)';
      ctx.beginPath();
      ctx.moveTo(r * 0.5, 0);
      ctx.lineTo(-r * 0.4, -r * 0.4);
      ctx.lineTo(-r * 0.4,  r * 0.4);
      ctx.closePath();
      ctx.fill();
      // Outline
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo( r + 3,  0);
      ctx.lineTo(-r,     -r * 0.82);
      ctx.lineTo(-r,      r * 0.82);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case 'shooter': {
      // Circle body
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      // Inner glow circle
      ctx.fillStyle = 'rgba(180,120,255,0.5)';
      ctx.beginPath();
      ctx.arc(-3, -3, 7, 0, Math.PI * 2);
      ctx.fill();
      // Outline
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
      ctx.stroke();
      // Gun barrel
      ctx.rotate(enemy.angle);
      ctx.fillStyle = '#444444';
      ctx.fillRect(enemy.radius - 2, -2, 12, 4);
      break;
    }

    case 'boss': {
      const bs = enemy.radius;
      // Main body (large square)
      ctx.fillStyle = col;
      ctx.fillRect(-bs, -bs, bs * 2, bs * 2);
      // Armor plate pattern
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-bs, -bs, bs, bs);   // top-left shade
      ctx.fillRect(  0,   0, bs, bs);   // bottom-right shade
      // Rivets/bolts (pixel detail)
      ctx.fillStyle = '#cc4400';
      for (const [rx, ry] of [[-bs+4,-bs+4],[bs-6,-bs+4],[-bs+4,bs-6],[bs-6,bs-6]]) {
        ctx.fillRect(rx, ry, 4, 4);
      }
      // Glowing eyes
      ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#ff6600';
      ctx.fillRect(-12, -14, 8, 9);
      ctx.fillRect(  4, -14, 8, 9);
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(-10, -12, 4, 5);
      ctx.fillRect(  6, -12, 4, 5);
      // HP bar above boss
      const bw = bs * 2 + 12;
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(-bs - 6, -bs - 14, bw, 8);
      ctx.fillStyle = '#ff2200';
      ctx.fillRect(-bs - 6, -bs - 14, bw * (enemy.hp / enemy.maxHp), 8);
      ctx.strokeStyle = '#660000';
      ctx.lineWidth = 1;
      ctx.strokeRect(-bs - 6, -bs - 14, bw, 8);
      break;
    }
  }

  ctx.restore();
}

// ─── Bullet ──────────────────────────────────────────────────────────────────
function drawBullet(ctx, bullet) {
  ctx.save();
  ctx.translate(Math.round(bullet.x), Math.round(bullet.y));

  if (bullet.owner === 'player') {
    ctx.rotate(bullet.angle);
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffff44';
    ctx.fillStyle = '#ffee44';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Bright core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff2200';
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffaa88';
    ctx.beginPath();
    ctx.arc(-1, -1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function drawHUD(ctx, game, W, H) {
  const { player, score, level, totalEnemies, enemiesKilled, highScore } = game;

  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, W, 38);

  // Score
  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(`SCORE: ${score}`, 10, 25);

  // Best
  ctx.fillStyle = '#888888';
  ctx.fillText(`BEST: ${highScore}`, 145, 25);

  // Level
  ctx.fillStyle = '#44ddff';
  ctx.textAlign = 'center';
  ctx.fillText(`LEVEL  ${level}`, W / 2, 25);
  ctx.textAlign = 'left';

  // Wave progress bar
  const barX = W / 2 + 60;
  const barW = 130;
  const prog = totalEnemies > 0 ? Math.min(1, enemiesKilled / totalEnemies) : 0;
  ctx.fillStyle = '#222233';
  ctx.fillRect(barX, 13, barW, 12);
  ctx.fillStyle = '#33ff66';
  ctx.fillRect(barX, 13, barW * prog, 12);
  ctx.strokeStyle = '#444466';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, 13, barW, 12);
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '10px monospace';
  ctx.fillText(`${enemiesKilled}/${totalEnemies}`, barX + barW + 5, 23);

  // Lives (hearts)
  for (let i = 0; i < player.maxHp; i++) {
    drawHeart(ctx, W - 95 + i * 30, 19, i < player.hp ? '#ff3355' : '#3a1020');
  }
}

function drawHeart(ctx, x, y, color) {
  ctx.fillStyle = color;
  // Simple pixel heart shape
  const pts = [
    [1,0],[2,0],[4,0],[5,0],
    [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],
    [2,4],[3,4],[4,4],
    [3,5]
  ];
  for (const [px, py] of pts) {
    ctx.fillRect(x + px * 2, y + py * 2, 2, 2);
  }
}

// ─── Menu ────────────────────────────────────────────────────────────────────
function drawMenu(ctx, W, H, highScore, time) {
  // Overlay
  ctx.fillStyle = 'rgba(8, 8, 18, 0.88)';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign = 'center';

  // Title with glow
  ctx.shadowBlur = 28;
  ctx.shadowColor = '#ff2244';
  ctx.fillStyle = '#ff2244';
  ctx.font = 'bold 70px monospace';
  ctx.fillText('DEAD ZONE', W / 2, H / 2 - 90);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#cc4444';
  ctx.font = '70px monospace';
  ctx.fillText('DEAD ZONE', W / 2 + 2, H / 2 - 88);

  // Subtitle
  ctx.fillStyle = '#888899';
  ctx.font = '16px monospace';
  ctx.fillText('A  TOP-DOWN  RETRO  SHOOTER', W / 2, H / 2 - 50);

  // Divider
  ctx.fillStyle = '#333344';
  ctx.fillRect(W / 2 - 180, H / 2 - 35, 360, 2);

  // Controls
  ctx.fillStyle = '#555577';
  ctx.font = '13px monospace';
  ctx.fillText('WASD / ARROWS : Move', W / 2, H / 2 - 10);
  ctx.fillText('MOUSE : Aim       CLICK : Shoot', W / 2, H / 2 + 12);

  // High score
  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(`HIGH SCORE: ${highScore}`, W / 2, H / 2 + 45);

  // Blinking press enter
  if (Math.floor(time * 1.8) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('[ PRESS ENTER TO START ]', W / 2, H / 2 + 82);
  }

  // Version
  ctx.fillStyle = '#333344';
  ctx.font = '11px monospace';
  ctx.fillText('v1.0', W / 2, H - 15);

  ctx.textAlign = 'left';
  ctx.restore();
}

// ─── Level Complete ───────────────────────────────────────────────────────────
function drawLevelComplete(ctx, W, H, level, score, time) {
  ctx.fillStyle = 'rgba(0, 15, 5, 0.82)';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.shadowBlur = 18;
  ctx.shadowColor = '#44ff66';
  ctx.fillStyle = '#44ff66';
  ctx.font = 'bold 46px monospace';
  ctx.fillText(`LEVEL ${level} COMPLETE!`, W / 2, H / 2 - 40);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffdd44';
  ctx.font = '22px monospace';
  ctx.fillText(`SCORE: ${score}`, W / 2, H / 2 + 12);

  if (Math.floor(time * 1.8) % 2 === 0) {
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '17px monospace';
    ctx.fillText('[ PRESS ENTER FOR NEXT LEVEL ]', W / 2, H / 2 + 58);
  }

  ctx.textAlign = 'left';
  ctx.restore();
}

// ─── Game Over ───────────────────────────────────────────────────────────────
function drawGameOver(ctx, W, H, score, highScore, isNewHigh, time) {
  ctx.fillStyle = 'rgba(18, 0, 0, 0.88)';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.shadowBlur = 24;
  ctx.shadowColor = '#ff0000';
  ctx.fillStyle = '#ff2222';
  ctx.font = 'bold 64px monospace';
  ctx.fillText('GAME OVER', W / 2, H / 2 - 55);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff';
  ctx.font = '22px monospace';
  ctx.fillText(`FINAL SCORE: ${score}`, W / 2, H / 2 + 5);

  if (isNewHigh) {
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 18px monospace';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffaa00';
    ctx.fillText('★  NEW HIGH SCORE!  ★', W / 2, H / 2 + 36);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = '#666677';
    ctx.font = '16px monospace';
    ctx.fillText(`BEST: ${highScore}`, W / 2, H / 2 + 36);
  }

  if (Math.floor(time * 1.8) % 2 === 0) {
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '17px monospace';
    ctx.fillText('[ PRESS ENTER TO PLAY AGAIN ]', W / 2, H / 2 + 78);
  }

  ctx.textAlign = 'left';
  ctx.restore();
}
