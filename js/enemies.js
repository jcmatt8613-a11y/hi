// Enemy type definitions and Enemy class.
import { positionAtDistance } from './grid.js';

export const ENEMY_TYPES = {
  slime:    { name: 'Slime',    color: '#8ecae6', stroke: '#219ebc', shape: 'circle',  speed: 45, hp: 20,   dmg: 1, reward: 6,  size: 9 },
  runner:   { name: 'Runner',   color: '#ffb5a7', stroke: '#b5454a', shape: 'triangle', speed: 80, hp: 14,   dmg: 1, reward: 7,  size: 9 },
  grunt:    { name: 'Grunt',    color: '#b5e48c', stroke: '#52b788', shape: 'circle',  speed: 50, hp: 40,   dmg: 2, reward: 10, size: 10 },
  tank:     { name: 'Tank',     color: '#adb5bd', stroke: '#495057', shape: 'square',  speed: 28, hp: 140,  dmg: 4, reward: 22, size: 13 },
  swarm:    { name: 'Swarm',    color: '#ffd166', stroke: '#d78f00', shape: 'diamond', speed: 65, hp: 12,   dmg: 1, reward: 5,  size: 8 },
  armored:  { name: 'Armored',  color: '#495867', stroke: '#1f2d3d', shape: 'hex',     speed: 34, hp: 260,  dmg: 5, reward: 36, size: 12 },
  ghost:    { name: 'Ghost',    color: '#c8b6ff', stroke: '#7b5fc7', shape: 'circle',  speed: 55, hp: 60,   dmg: 3, reward: 18, size: 10, alpha: 0.65 },
  brute:    { name: 'Brute',    color: '#e07a5f', stroke: '#a33e2a', shape: 'square',  speed: 32, hp: 420,  dmg: 6, reward: 55, size: 14 },
  drone:    { name: 'Drone',    color: '#90e0ef', stroke: '#0077b6', shape: 'diamond', speed: 90, hp: 32,   dmg: 2, reward: 12, size: 9 },
  // Bosses
  boss_golem:    { name: 'Stone Golem',    color: '#6c757d', stroke: '#1a1d20', shape: 'square', speed: 22, hp: 2800,  dmg: 15, reward: 320, size: 20, boss: true },
  boss_phantom:  { name: 'Phantom Lord',   color: '#b388ff', stroke: '#311b92', shape: 'circle', speed: 36, hp: 4200,  dmg: 18, reward: 440, size: 20, boss: true, alpha: 0.8 },
  boss_dragon:   { name: 'Crimson Dragon', color: '#d62828', stroke: '#6a040f', shape: 'diamond', speed: 30, hp: 6800, dmg: 22, reward: 620, size: 22, boss: true },
  boss_titan:    { name: 'Frost Titan',    color: '#90e0ef', stroke: '#03045e', shape: 'hex',    speed: 26, hp: 9200,  dmg: 25, reward: 780, size: 22, boss: true },
  boss_overlord: { name: 'The Overlord',   color: '#ff006e', stroke: '#3a0ca3', shape: 'square', speed: 32, hp: 14000, dmg: 30, reward: 1100, size: 24, boss: true },
};

export class Enemy {
  constructor(typeId, pathInfo, waveMultiplier = 1) {
    const type = ENEMY_TYPES[typeId];
    this.typeId = typeId;
    this.type = type;
    this.maxHp = Math.round(type.hp * waveMultiplier);
    this.hp = this.maxHp;
    this.baseSpeed = type.speed;
    this.speed = type.speed; // px/sec along path
    this.dist = 0;
    this.pathInfo = pathInfo;
    const pos = positionAtDistance(pathInfo.segments, pathInfo.total, 0);
    this.x = pos.x;
    this.y = pos.y;
    this.done = false;
    this.alive = true;
    this.reachedEnd = false;
    // status effects
    this.slowFactor = 1;
    this.slowUntil = 0;
    this.poisonDps = 0;
    this.poisonUntil = 0;
    // Effective reward scales with wave
    this.reward = Math.round(type.reward * Math.max(1, 0.6 + 0.4 * waveMultiplier));
  }

  applySlow(factor, durationMs, now) {
    // factor < 1 slows. Keep the strongest active slow.
    if (now >= this.slowUntil || factor < this.slowFactor) {
      this.slowFactor = factor;
      this.slowUntil = now + durationMs;
    } else {
      this.slowUntil = Math.max(this.slowUntil, now + durationMs);
    }
  }

  applyPoison(dps, durationMs, now) {
    this.poisonDps = Math.max(this.poisonDps, dps);
    this.poisonUntil = Math.max(this.poisonUntil, now + durationMs);
  }

  update(dt, now) {
    if (!this.alive) return;

    // Poison tick
    if (now < this.poisonUntil && this.poisonDps > 0) {
      this.hp -= this.poisonDps * dt;
      if (this.hp <= 0) { this.alive = false; return; }
    } else if (now >= this.poisonUntil) {
      this.poisonDps = 0;
    }

    // Slow expiry
    if (now >= this.slowUntil) this.slowFactor = 1;

    // Move along path
    this.speed = this.baseSpeed * this.slowFactor;
    this.dist += this.speed * dt;
    const pos = positionAtDistance(this.pathInfo.segments, this.pathInfo.total, this.dist);
    this.x = pos.x; this.y = pos.y;
    if (pos.done) {
      this.reachedEnd = true;
      this.alive = false;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) { this.alive = false; }
  }

  draw(ctx) {
    const t = this.type;
    ctx.save();
    if (t.alpha) ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.color;
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 2;
    const s = t.size;
    drawShape(ctx, t.shape, this.x, this.y, s);

    // Status overlays
    if (this.slowFactor < 1) {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#7ee8fa';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y, s + 4, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.poisonDps > 0) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#8ac926';
      ctx.beginPath(); ctx.arc(this.x + s * 0.6, this.y - s * 0.6, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // HP bar
    const w = Math.max(18, s * 2);
    const bx = this.x - w / 2;
    const by = this.y - s - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx - 1, by - 1, w + 2, 5);
    ctx.fillStyle = '#ef476f';
    ctx.fillRect(bx, by, w, 3);
    ctx.fillStyle = '#06d6a0';
    ctx.fillRect(bx, by, w * Math.max(0, this.hp / this.maxHp), 3);
  }
}

function drawShape(ctx, shape, x, y, s) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(x, y, s, 0, Math.PI * 2);
  } else if (shape === 'square') {
    ctx.rect(x - s, y - s, s * 2, s * 2);
  } else if (shape === 'triangle') {
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s, y + s);
    ctx.lineTo(x - s, y + s);
    ctx.closePath();
  } else if (shape === 'diamond') {
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s, y);
    ctx.closePath();
  } else if (shape === 'hex') {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 3 * i - Math.PI / 2;
      const px = x + Math.cos(a) * s;
      const py = y + Math.sin(a) * s;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
}
