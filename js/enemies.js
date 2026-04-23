// Enemy type catalog + Enemy class.
// Enemies walk along a precomputed path and can be damaged, slowed, or poisoned.
import { positionAtDistance } from './grid.js';

export const ENEMY_TYPES = {
  // --- Ground ---
  slime:    { name: 'Slime',    color: '#8ecae6', stroke: '#219ebc', shape: 'circle',   speed: 45, hp: 20,   dmg: 1, reward: 6,  size: 9 },
  runner:   { name: 'Runner',   color: '#ffb5a7', stroke: '#b5454a', shape: 'triangle', speed: 80, hp: 14,   dmg: 1, reward: 7,  size: 9 },
  grunt:    { name: 'Grunt',    color: '#b5e48c', stroke: '#52b788', shape: 'circle',   speed: 50, hp: 40,   dmg: 2, reward: 10, size: 10 },
  tank:     { name: 'Tank',     color: '#adb5bd', stroke: '#495057', shape: 'square',   speed: 28, hp: 140,  dmg: 4, reward: 22, size: 13 },
  swarm:    { name: 'Swarm',    color: '#ffd166', stroke: '#d78f00', shape: 'diamond',  speed: 65, hp: 12,   dmg: 1, reward: 5,  size: 8 },
  armored:  { name: 'Armored',  color: '#495867', stroke: '#1f2d3d', shape: 'hex',      speed: 34, hp: 260,  dmg: 5, reward: 36, size: 12, armor: 0.35 },
  ghost:    { name: 'Ghost',    color: '#c8b6ff', stroke: '#7b5fc7', shape: 'circle',   speed: 55, hp: 60,   dmg: 3, reward: 18, size: 10, alpha: 0.65 },
  brute:    { name: 'Brute',    color: '#e07a5f', stroke: '#a33e2a', shape: 'square',   speed: 32, hp: 420,  dmg: 6, reward: 55, size: 14 },
  drone:    { name: 'Drone',    color: '#90e0ef', stroke: '#0077b6', shape: 'diamond',  speed: 90, hp: 32,   dmg: 2, reward: 12, size: 9 },

  // --- New mechanics ---
  shielded: { name: 'Shielded', color: '#9bc1bc', stroke: '#1b4332', shape: 'hex',      speed: 38, hp: 80, shield: 120, dmg: 3, reward: 28, size: 11 },
  regen:    { name: 'Regen',    color: '#84a59d', stroke: '#1a4d39', shape: 'circle',   speed: 40, hp: 220, dmg: 3, reward: 30, size: 11, regen: 14 },
  splitter: { name: 'Splitter', color: '#fca311', stroke: '#c77800', shape: 'diamond',  speed: 38, hp: 130, dmg: 3, reward: 22, size: 12, splits: 'slime', splitCount: 3 },
  healer:   { name: 'Healer',   color: '#e9c46a', stroke: '#8a6d00', shape: 'circle',   speed: 36, hp: 110, dmg: 2, reward: 28, size: 11, healRadius: 80, healDps: 20 },

  // --- Flying (can only be targeted by anti-air towers) ---
  bat:      { name: 'Bat',      color: '#6d6875', stroke: '#1d1c28', shape: 'triangle', speed: 85, hp: 45,  dmg: 2, reward: 14, size: 9,  flying: true },
  vulture:  { name: 'Vulture',  color: '#b5838d', stroke: '#3c1a1b', shape: 'diamond',  speed: 95, hp: 85,  dmg: 3, reward: 22, size: 10, flying: true },
  dragonkin:{ name: 'Dragonkin',color: '#f4a261', stroke: '#6a040f', shape: 'triangle', speed: 70, hp: 260, dmg: 5, reward: 50, size: 12, flying: true },

  // --- Bosses ---
  boss_golem:     { name: 'Stone Golem',    color: '#6c757d', stroke: '#1a1d20', shape: 'square',   speed: 22, hp: 2800,  dmg: 15, reward: 320,  size: 20, boss: true, armor: 0.25 },
  boss_phantom:   { name: 'Phantom Lord',   color: '#b388ff', stroke: '#311b92', shape: 'circle',   speed: 36, hp: 4200,  dmg: 18, reward: 440,  size: 20, boss: true, alpha: 0.8 },
  boss_dragon:    { name: 'Crimson Dragon', color: '#d62828', stroke: '#6a040f', shape: 'diamond',  speed: 30, hp: 6800,  dmg: 22, reward: 620,  size: 22, boss: true, flying: true },
  boss_titan:     { name: 'Frost Titan',    color: '#90e0ef', stroke: '#03045e', shape: 'hex',      speed: 26, hp: 9200,  dmg: 25, reward: 780,  size: 22, boss: true, armor: 0.4 },
  boss_overlord:  { name: 'The Overlord',   color: '#ff006e', stroke: '#3a0ca3', shape: 'square',   speed: 32, hp: 14000, dmg: 30, reward: 1100, size: 24, boss: true },
  boss_hydra:     { name: 'Hydra Queen',    color: '#06a77d', stroke: '#002a1a', shape: 'diamond',  speed: 28, hp: 22000, dmg: 35, reward: 1500, size: 24, boss: true, splits: 'dragonkin', splitCount: 4 },
  boss_lich:      { name: 'Lich King',      color: '#4a0e4e', stroke: '#0b0212', shape: 'hex',      speed: 30, hp: 30000, dmg: 40, reward: 2000, size: 26, boss: true, healDps: 60, healRadius: 110, regen: 40 },
  boss_avatar:    { name: 'Celestial Avatar',color: '#ffd60a', stroke: '#7a4f00', shape: 'circle',  speed: 34, hp: 45000, dmg: 48, reward: 2800, size: 26, boss: true, alpha: 0.9 },
};

export class Enemy {
  constructor(typeId, pathInfo, opts = {}) {
    const type = ENEMY_TYPES[typeId];
    this.typeId = typeId;
    this.type = type;
    this.hpScale = opts.hpScale || 1;
    this.speedScale = opts.speedScale || 1;
    this.rewardScale = opts.rewardScale || 1;
    this.maxHp = Math.round(type.hp * this.hpScale);
    this.hp = this.maxHp;
    this.shield = type.shield ? Math.round(type.shield * this.hpScale) : 0;
    this.maxShield = this.shield;
    this.baseSpeed = type.speed * this.speedScale;
    this.speed = this.baseSpeed;
    this.dist = opts.startDist || 0;
    this.pathInfo = pathInfo;
    const pos = positionAtDistance(pathInfo.segments, pathInfo.total, this.dist);
    this.x = pos.x;
    this.y = pos.y;
    this.done = false;
    this.alive = true;
    this.reachedEnd = false;
    // Status effects
    this.slowFactor = 1;
    this.slowUntil = 0;
    this.poisonDps = 0;
    this.poisonUntil = 0;
    this.burning = 0; // remaining burn damage per second
    this.burnUntil = 0;
    this.stunnedUntil = 0;
    // Visuals
    this.bobPhase = Math.random() * Math.PI * 2;
    this.reward = Math.round(type.reward * this.rewardScale);
  }

  get isFlying() { return !!this.type.flying; }
  get isBoss() { return !!this.type.boss; }

  applySlow(factor, durationMs, now) {
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

  applyBurn(dps, durationMs, now) {
    this.burning = Math.max(this.burning, dps);
    this.burnUntil = Math.max(this.burnUntil, now + durationMs);
  }

  applyStun(durationMs, now) {
    if (this.isBoss) durationMs *= 0.25;
    this.stunnedUntil = Math.max(this.stunnedUntil, now + durationMs);
  }

  takeDamage(amount, opts = {}) {
    if (!this.alive) return 0;
    // Armor reduction (unless piercing)
    if (!opts.pierce && this.type.armor) {
      amount *= (1 - this.type.armor);
    }
    let remaining = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) this.hp -= remaining;
    if (this.hp <= 0) this.alive = false;
    return amount;
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
    // Burn tick
    if (now < this.burnUntil && this.burning > 0) {
      this.hp -= this.burning * dt;
      if (this.hp <= 0) { this.alive = false; return; }
    } else if (now >= this.burnUntil) {
      this.burning = 0;
    }
    // Regen (capped at max)
    if (this.type.regen && this.hp > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.type.regen * dt);
    }
    // Slow expiry
    if (now >= this.slowUntil) this.slowFactor = 1;
    // Stun
    if (now < this.stunnedUntil) return;

    // Move along path
    this.speed = this.baseSpeed * this.slowFactor;
    this.dist += this.speed * dt;
    const pos = positionAtDistance(this.pathInfo.segments, this.pathInfo.total, this.dist);
    this.x = pos.x; this.y = pos.y;
    // Flying enemies bob slightly above path
    if (this.isFlying) {
      this.bobPhase += dt * 4;
      this.y -= 6 + Math.sin(this.bobPhase) * 3;
    }
    if (pos.done) {
      this.reachedEnd = true;
      this.alive = false;
    }
  }

  draw(ctx, gameTime = performance.now()) {
    const t = this.type;
    ctx.save();
    if (t.alpha) ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.color;
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 2;
    const s = t.size;
    drawShape(ctx, t.shape, this.x, this.y, s);

    // Boss crown
    if (t.boss) {
      ctx.fillStyle = '#ffd60a';
      ctx.strokeStyle = '#7a4f00';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.x - s + 2, this.y - s - 4);
      ctx.lineTo(this.x - s * 0.4, this.y - s - 12);
      ctx.lineTo(this.x, this.y - s - 4);
      ctx.lineTo(this.x + s * 0.4, this.y - s - 12);
      ctx.lineTo(this.x + s - 2, this.y - s - 4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // Flying shadow under path position (to indicate air)
    if (this.isFlying) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 14, s * 0.9, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Status overlays
    if (this.slowFactor < 1) {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#7ee8fa';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y, s + 4, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.poisonDps > 0) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#8ac926';
      ctx.beginPath(); ctx.arc(this.x + s * 0.6, this.y - s * 0.6, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (this.burning > 0) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath(); ctx.arc(this.x - s * 0.5, this.y - s * 0.7, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (gameTime < this.stunnedUntil) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(this.x, this.y - s - 6, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Shield ring
    if (this.shield > 0) {
      ctx.save();
      const frac = this.shield / this.maxShield;
      ctx.strokeStyle = '#48cae4';
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, s + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();
      ctx.restore();
    }

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
