// Animated background: starfield + weather particles (rain, snow, embers).
export class Background {
  constructor(theme) {
    this.theme = theme;
    this.stars = [];
    this.particles = [];
    this.mode = 'stars';
    this.init();
  }

  setTheme(theme) { this.theme = theme; this.init(); }

  setWeather(mode) { this.mode = mode; this.particles = []; }

  init() {
    this.stars = [];
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * 600, y: Math.random() * 600,
        r: 0.5 + Math.random() * 1.2,
        a: 0.3 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  update(dt) {
    // Maintain particle count
    const target = this.mode === 'none' ? 0 : (this.mode === 'snow' ? 120 : this.mode === 'rain' ? 160 : 90);
    while (this.particles.length < target) this.particles.push(this.spawnParticle());

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (this.mode === 'rain') p.y += 380 * dt;
      if (this.mode === 'snow') { p.y += 40 * dt; p.x += Math.sin((p.y + p.phase) * 0.02) * 10 * dt; }
      if (this.mode === 'embers') { p.y -= 60 * dt; p.x += Math.sin(p.phase + p.y * 0.05) * 10 * dt; }
      if (p.y > 620 || p.y < -20 || p.x < -20 || p.x > 620) {
        Object.assign(p, this.spawnParticle(true));
      }
    }

    for (const s of this.stars) s.phase += dt * 0.8;
  }

  spawnParticle(reset = false) {
    if (this.mode === 'snow') {
      return { x: Math.random() * 620, y: reset ? -10 : Math.random() * 600, vx: -10 + Math.random() * 20, vy: 20 + Math.random() * 40, size: 1.5 + Math.random() * 1.5, phase: Math.random() * 10, color: 'rgba(255,255,255,0.85)' };
    } else if (this.mode === 'rain') {
      return { x: Math.random() * 620, y: reset ? -20 : Math.random() * 600, vx: -40, vy: 0, size: 2, phase: 0, color: 'rgba(144,224,239,0.6)' };
    } else if (this.mode === 'embers') {
      return { x: Math.random() * 620, y: reset ? 620 : Math.random() * 600, vx: -5 + Math.random() * 10, vy: 0, size: 1 + Math.random() * 2, phase: Math.random() * 10, color: `rgba(255,${120 + Math.random() * 80 | 0},50,0.85)` };
    }
    return { x: Math.random() * 620, y: reset ? 620 : Math.random() * 600, vx: 0, vy: 0, size: 1, phase: 0, color: 'rgba(255,255,255,0.3)' };
  }

  drawSky(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, this.theme.sky[0]);
    g.addColorStop(1, this.theme.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (const s of this.stars) {
      const alpha = s.a * (0.6 + 0.4 * Math.sin(s.phase));
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawForeground(ctx) {
    if (this.mode === 'rain') {
      ctx.strokeStyle = 'rgba(144,224,239,0.6)';
      ctx.lineWidth = 1;
      for (const p of this.particles) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 4, p.y + 10); ctx.stroke();
      }
    } else {
      for (const p of this.particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}
