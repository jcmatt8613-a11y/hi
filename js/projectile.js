// Projectiles and visual FX (hits, beams, lightning arcs).

export class Projectile {
  constructor({ x, y, target, speed, damage, color, splash = 0, onHit = null, tracking = true }) {
    this.x = x; this.y = y;
    this.target = target;
    this.speed = speed; // px/sec
    this.damage = damage;
    this.color = color;
    this.splash = splash;
    this.onHit = onHit;
    this.tracking = tracking;
    this.alive = true;
    // Fixed vector if not tracking
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
      // Target died — fly to last known position briefly then die.
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
      // Out of bounds
      if (this.x < -20 || this.x > 620 || this.y < -20 || this.y > 620) this.alive = false;
    }
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();
  }

  hit(enemies, now) {
    this.alive = false;
    if (this.splash > 0) {
      for (const e of enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d <= this.splash) {
          const falloff = 1 - 0.4 * (d / this.splash);
          e.takeDamage(this.damage * falloff);
        }
      }
    } else if (this.target && this.target.alive) {
      this.target.takeDamage(this.damage);
    }
    if (this.onHit) this.onHit(this, enemies, now);
  }

  draw(ctx) {
    // Trail
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
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.splash > 0 ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

// Short-lived visual effects (explosion bloom, lightning arc, beam flash).
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
    }
    ctx.restore();
  }
}
