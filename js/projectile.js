// Projectiles, visual FX (explosions, beams, lightning arcs, damage numbers).

export class Projectile {
  constructor({ x, y, target, speed, damage, color, splash = 0, onHit = null, tracking = true, pierce = false, isCrit = false }) {
    this.x = x; this.y = y;
    this.target = target;
    this.speed = speed;
    this.damage = damage;
    this.color = color;
    this.splash = splash;
    this.onHit = onHit;
    this.tracking = tracking;
    this.pierce = pierce;
    this.isCrit = isCrit;
    this.alive = true;
    if (!tracking && target) {
      const dx = target.x - x, dy = target.y - y;
      const len = Math.hypot(dx, dy) || 1;
      this.vx = dx / len * speed;
      this.vy = dy / len * speed;
    }
    this.trail = [];
  }

  update(dt, enemies, now) {
    if (!this.alive) return;
    let tx, ty;
    if (this.tracking && this.target && this.target.alive) {
      tx = this.target.x; ty = this.target.y;
    } else if (this.tracking) {
      this.alive = false; return;
    } else {
      tx = this.x + this.vx; ty = this.y + this.vy;
    }
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step + 4) {
      this.x = tx; this.y = ty;
      this.hit(enemies, now);
      return;
    }
    if (this.tracking) {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    } else {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.x < -20 || this.x > 620 || this.y < -20 || this.y > 620) this.alive = false;
    }
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();
  }

  hit(enemies, now) {
    this.alive = false;
    const hits = [];
    if (this.splash > 0) {
      for (const e of enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d <= this.splash) {
          const falloff = 1 - 0.4 * (d / this.splash);
          const applied = e.takeDamage(this.damage * falloff, { pierce: this.pierce });
          hits.push({ enemy: e, applied });
        }
      }
    } else if (this.target && this.target.alive) {
      const applied = this.target.takeDamage(this.damage, { pierce: this.pierce });
      hits.push({ enemy: this.target, applied });
    }
    if (this.onHit) this.onHit(this, enemies, now, hits);
  }

  draw(ctx) {
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const a = (i + 1) / this.trail.length * 0.5;
      ctx.globalAlpha = a;
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(t.x, t.y, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    const size = this.splash > 0 ? 5 : (this.isCrit ? 4 : 3);
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (this.isCrit) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size + 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export class FX {
  constructor(kind, params) {
    this.kind = kind;
    this.params = params;
    this.start = performance.now();
    this.duration = params.duration || 220;
    this.alive = true;
  }
  update() {
    if (performance.now() - this.start >= this.duration) this.alive = false;
  }
  progress() { return Math.min(1, (performance.now() - this.start) / this.duration); }

  draw(ctx) {
    const p = this.progress();
    ctx.save();
    if (this.kind === 'explosion') {
      const { x, y, radius, color } = this.params;
      const r = radius * (0.5 + 0.5 * p);
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = (1 - p) * 0.6;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, r * 1.1, 0, Math.PI * 2); ctx.stroke();
    } else if (this.kind === 'beam') {
      const { x1, y1, x2, y2, color } = this.params;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    } else if (this.kind === 'lightning') {
      const { points, color } = this.params;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (this.kind === 'muzzle') {
      const { x, y, color } = this.params;
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, 5 + p * 4, 0, Math.PI * 2); ctx.fill();
    } else if (this.kind === 'dmgnumber') {
      const { x, y, text, color, crit } = this.params;
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = color || '#fff';
      ctx.font = crit ? 'bold 16px sans-serif' : 'bold 12px sans-serif';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(text, x, y - p * 26);
      ctx.fillText(text, x, y - p * 26);
    } else if (this.kind === 'ring') {
      const { x, y, radius, color } = this.params;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, radius * p, 0, Math.PI * 2); ctx.stroke();
    } else if (this.kind === 'text') {
      const { x, y, text, color, font } = this.params;
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = color || '#fff';
      ctx.font = font || 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 2.5;
      ctx.strokeText(text, x, y - p * 18);
      ctx.fillText(text, x, y - p * 18);
    }
    ctx.restore();
  }
}
