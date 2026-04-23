// Main Game class. Manages state, entities, game loop, and rendering.
import {
  GRID_SIZE, TILE_SIZE, PATH_POINTS, buildPathTiles, key,
  tileCenter, pixelToTile, buildPathSegments,
} from './grid.js';
import { Enemy, ENEMY_TYPES } from './enemies.js';
import { TOWER_DEFS, Tower, getTowerDef } from './towers.js';
import { Projectile, FX } from './projectile.js';
import { generateWave, hpMultiplierForWave } from './waves.js';
import { sfx, resumeAudio } from './sound.js';

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;

    this.pathTiles = buildPathTiles(PATH_POINTS);
    this.pathInfo = buildPathSegments(PATH_POINTS);

    this.reset();
    this.running = false;

    this.boundLoop = this.loop.bind(this);
    this.lastTime = 0;

    this.attachCanvasEvents();
  }

  reset() {
    this.health = 100;
    this.money = 500;
    this.score = 0;
    this.wave = 0;
    this.enemies = [];
    this.projectiles = [];
    this.fx = [];
    this.towers = [];
    this.towersByTile = new Map();
    this.selectedTower = null; // placed tower selected
    this.placingDefId = null; // tower def id to place
    this.hoverTile = null;
    this.mouse = { x: -1, y: -1 };
    this.speed = 1; // 1 / 2 / 4
    this.paused = false;
    this.gameOver = false;

    // Wave spawning state
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveActive = false;
    this.betweenWaveTimer = 2500; // ms until wave 1 starts
    this.hpMult = 1;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.boundLoop);
  }

  stop() { this.running = false; }

  setSpeed(s) { this.speed = s; this.ui.updateSpeedButtons(s); }
  togglePause() { this.paused = !this.paused; this.ui.updatePauseButton(this.paused); }

  // --- Placement ---
  selectShopTower(defId) {
    this.placingDefId = defId;
    this.selectedTower = null;
    this.ui.selectShopCard(defId);
    this.ui.hideSelectedTowerPanel();
  }

  cancelPlacement() {
    this.placingDefId = null;
    this.ui.selectShopCard(null);
  }

  selectPlacedTower(tower) {
    this.selectedTower = tower;
    this.placingDefId = null;
    this.ui.selectShopCard(null);
    this.ui.showSelectedTowerPanel(tower);
  }

  canPlaceAt(c, r, defId) {
    if (c < 0 || c >= GRID_SIZE || r < 0 || r >= GRID_SIZE) return false;
    if (this.pathTiles.has(key(c, r))) return false;
    if (this.towersByTile.has(key(c, r))) return false;
    const def = getTowerDef(defId);
    if (!def) return false;
    if (this.money < def.cost) return false;
    return true;
  }

  placeTower(c, r) {
    if (!this.placingDefId) return;
    if (!this.canPlaceAt(c, r, this.placingDefId)) { sfx.error(); return; }
    const def = getTowerDef(this.placingDefId);
    this.money -= def.cost;
    const t = new Tower(this.placingDefId, c, r);
    this.towers.push(t);
    this.towersByTile.set(key(c, r), t);
    sfx.place();
    // Keep same tower selected for rapid placement (until shift click? Keep simple: deselect).
    this.placingDefId = null;
    this.ui.selectShopCard(null);
    this.ui.updateAffordability(this.money);
    this.ui.updateStats(this);
  }

  upgradeSelected() {
    const t = this.selectedTower;
    if (!t) return;
    if (t.level >= 3) { sfx.error(); return; }
    const cost = t.upgradeCost();
    if (this.money < cost) { sfx.error(); return; }
    this.money -= cost;
    t.tryUpgrade();
    sfx.upgrade();
    this.ui.updateStats(this);
    this.ui.showSelectedTowerPanel(t);
    this.ui.updateAffordability(this.money);
  }

  sellSelected() {
    const t = this.selectedTower;
    if (!t) return;
    this.money += t.sellValue();
    this.towers = this.towers.filter(x => x !== t);
    this.towersByTile.delete(key(t.c, t.r));
    this.selectedTower = null;
    sfx.sell();
    this.ui.hideSelectedTowerPanel();
    this.ui.updateStats(this);
    this.ui.updateAffordability(this.money);
  }

  // --- Waves ---
  startNextWave() {
    this.wave += 1;
    this.hpMult = hpMultiplierForWave(this.wave);
    const entries = generateWave(this.wave);
    this.spawnQueue = entries.slice();
    this.spawnTimer = 0;
    this.waveActive = true;
    const isBoss = this.wave % 10 === 0;
    this.ui.showWaveBanner(this.wave, isBoss);
    if (isBoss) sfx.boss(); else sfx.wave();
    this.ui.updateStats(this);
  }

  // --- Canvas events ---
  attachCanvasEvents() {
    const rect = () => this.canvas.getBoundingClientRect();
    this.canvas.addEventListener('mousemove', (e) => {
      const r = rect();
      const sx = this.canvas.width / r.width;
      const sy = this.canvas.height / r.height;
      this.mouse.x = (e.clientX - r.left) * sx;
      this.mouse.y = (e.clientY - r.top) * sy;
      this.hoverTile = pixelToTile(this.mouse.x, this.mouse.y);
    });
    this.canvas.addEventListener('mouseleave', () => { this.hoverTile = null; });
    this.canvas.addEventListener('click', (e) => {
      resumeAudio();
      const r = rect();
      const sx = this.canvas.width / r.width;
      const sy = this.canvas.height / r.height;
      const x = (e.clientX - r.left) * sx;
      const y = (e.clientY - r.top) * sy;
      const tile = pixelToTile(x, y);
      if (!tile) return;

      // If placing, place; else try to select a tower on this tile.
      if (this.placingDefId) {
        this.placeTower(tile.c, tile.r);
      } else {
        const existing = this.towersByTile.get(key(tile.c, tile.r));
        if (existing) {
          this.selectPlacedTower(existing);
        } else {
          this.selectedTower = null;
          this.ui.hideSelectedTowerPanel();
        }
      }
    });
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.cancelPlacement();
      this.selectedTower = null;
      this.ui.hideSelectedTowerPanel();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this.cancelPlacement(); this.selectedTower = null; this.ui.hideSelectedTowerPanel(); }
      if (e.key === ' ') { e.preventDefault(); this.togglePause(); }
      if (e.key === '1') this.setSpeed(1);
      if (e.key === '2') this.setSpeed(2);
      if (e.key === '3') this.setSpeed(4);
      if (e.key.toLowerCase() === 'u' && this.selectedTower) this.upgradeSelected();
      if (e.key.toLowerCase() === 's' && this.selectedTower) this.sellSelected();
    });
  }

  // --- Main loop ---
  loop(now) {
    if (!this.running) return;
    const realDt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    if (!this.paused && !this.gameOver) {
      const dt = realDt * this.speed;
      this.update(dt, now);
    }
    this.render();
    requestAnimationFrame(this.boundLoop);
  }

  update(dt, now) {
    // Wave management
    if (!this.waveActive) {
      this.betweenWaveTimer -= dt * 1000;
      if (this.betweenWaveTimer <= 0) this.startNextWave();
    }
    if (this.waveActive) {
      this.spawnTimer -= dt * 1000;
      while (this.spawnTimer <= 0 && this.spawnQueue.length > 0) {
        const entry = this.spawnQueue.shift();
        const e = new Enemy(entry.type, this.pathInfo, this.hpMult);
        this.enemies.push(e);
        this.spawnTimer += entry.delay;
      }
      if (this.spawnQueue.length === 0 && this.enemies.length === 0) {
        this.waveActive = false;
        // Wave clear bonus scales with wave number
        const bonus = 40 + this.wave * 8;
        this.money += bonus;
        this.score += bonus;
        this.betweenWaveTimer = 2200;
        this.ui.updateAffordability(this.money);
      }
    }

    // Enemies
    for (const e of this.enemies) e.update(dt, now);
    // Handle leaks and deaths
    const survivors = [];
    for (const e of this.enemies) {
      if (!e.alive && e.reachedEnd) {
        this.health -= e.type.dmg;
        sfx.leak();
        if (this.health <= 0) { this.health = 0; this.endGame(false); }
      } else if (!e.alive) {
        this.money += e.reward;
        this.score += e.reward;
        if (e.type.boss) sfx.bossDie(); else sfx.enemyDie();
        this.fx.push(new FX('explosion', { x: e.x, y: e.y, radius: e.type.size + 6, color: e.type.color, duration: 240 }));
      } else {
        survivors.push(e);
      }
    }
    this.enemies = survivors;

    // Towers fire
    for (const t of this.towers) this.towerFire(t, now);

    // Projectiles
    for (const p of this.projectiles) p.update(dt, this.enemies, now);
    this.projectiles = this.projectiles.filter(p => p.alive);

    // FX
    for (const f of this.fx) f.update();
    this.fx = this.fx.filter(f => f.alive);

    this.ui.updateStats(this);
    this.ui.updateAffordability(this.money);
  }

  // Find nearest enemy (furthest along path) within range.
  pickTarget(tower) {
    let best = null;
    let bestDist = -1;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d2 = (e.x - tower.x) ** 2 + (e.y - tower.y) ** 2;
      if (d2 <= tower.range * tower.range) {
        // Prefer enemies further along the path (first).
        if (e.dist > bestDist) { bestDist = e.dist; best = e; }
      }
    }
    return best;
  }

  towerFire(tower, now) {
    const arche = tower.def.archetype;
    const target = this.pickTarget(tower);
    if (target) {
      const ang = Math.atan2(target.y - tower.y, target.x - tower.x);
      // Smooth turret rotation
      const diff = ((ang - tower.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      tower.angle += diff * 0.35;
    }
    if (!target) return;
    if (now - tower.lastShot < tower.cooldown) return;
    tower.lastShot = now;

    const baseColor = tower.def.color;

    if (arche === 'basic' || arche === 'rapid' || arche === 'sniper') {
      this.projectiles.push(new Projectile({
        x: tower.x, y: tower.y, target,
        speed: arche === 'sniper' ? 720 : (arche === 'rapid' ? 520 : 440),
        damage: tower.damage, color: baseColor,
      }));
      this.fx.push(new FX('muzzle', { x: tower.x + Math.cos(tower.angle) * 14, y: tower.y + Math.sin(tower.angle) * 14, color: baseColor, duration: 120 }));
      if (arche === 'sniper') {
        // Tracer beam for effect
        this.fx.push(new FX('beam', { x1: tower.x, y1: tower.y, x2: target.x, y2: target.y, color: '#cfe8ff', duration: 120 }));
      }
      sfx.shoot();
    } else if (arche === 'cannon') {
      // Lobbed projectile that explodes on arrival.
      this.projectiles.push(new Projectile({
        x: tower.x, y: tower.y, target,
        speed: 360, damage: tower.damage, color: baseColor,
        splash: tower.splash,
        onHit: (proj, enemies) => {
          this.fx.push(new FX('explosion', { x: proj.x, y: proj.y, radius: tower.splash, color: baseColor, duration: 260 }));
        },
      }));
      sfx.cannon();
    } else if (arche === 'frost') {
      this.projectiles.push(new Projectile({
        x: tower.x, y: tower.y, target,
        speed: 500, damage: tower.damage, color: baseColor,
        onHit: (proj) => {
          // Apply slow to target and slight AoE
          const r = TILE_SIZE * 1.2;
          for (const e of this.enemies) {
            if (!e.alive) continue;
            const d = Math.hypot(e.x - proj.x, e.y - proj.y);
            if (d <= r) {
              e.applySlow(tower.slow, tower.slowDur, now);
            }
          }
        },
      }));
      sfx.freeze();
    } else if (arche === 'poison') {
      this.projectiles.push(new Projectile({
        x: tower.x, y: tower.y, target,
        speed: 460, damage: tower.damage, color: baseColor,
        onHit: (proj) => {
          const r = TILE_SIZE * 1.0;
          for (const e of this.enemies) {
            if (!e.alive) continue;
            const d = Math.hypot(e.x - proj.x, e.y - proj.y);
            if (d <= r) e.applyPoison(tower.poisonDps, tower.poisonDur, now);
          }
        },
      }));
      sfx.poison();
    } else if (arche === 'chain') {
      // Instant lightning that bounces to nearest enemies.
      const hit = new Set([target]);
      let cur = target;
      let dmg = tower.damage;
      const points = [{ x: tower.x, y: tower.y }];
      for (let i = 0; i <= tower.chains; i++) {
        if (!cur || !cur.alive) break;
        cur.takeDamage(dmg);
        points.push({ x: cur.x, y: cur.y });
        dmg *= 0.75;
        // Find next nearest not already hit
        let next = null; let nd = Infinity;
        for (const e of this.enemies) {
          if (!e.alive || hit.has(e)) continue;
          const d = Math.hypot(e.x - cur.x, e.y - cur.y);
          if (d <= tower.chainRange && d < nd) { next = e; nd = d; }
        }
        cur = next;
        if (cur) hit.add(cur);
      }
      // Jitter the lightning
      const jitter = points.map((p, i) => i === 0 || i === points.length - 1
        ? p : { x: p.x + (Math.random() - 0.5) * 8, y: p.y + (Math.random() - 0.5) * 8 });
      this.fx.push(new FX('lightning', { points: jitter, color: baseColor, duration: 180 }));
      sfx.zap();
    } else if (arche === 'laser') {
      // Continuous-ish beam: damage applied immediately with short visual.
      target.takeDamage(tower.damage);
      tower.beamUntil = now + 90;
      tower.beamTarget = target;
      this.fx.push(new FX('beam', { x1: tower.x, y1: tower.y, x2: target.x, y2: target.y, color: baseColor, duration: 90 }));
      sfx.laser();
    }
  }

  endGame(victory) {
    this.gameOver = true;
    sfx.gameOver();
    this.ui.showGameOver(this.wave, victory);
  }

  // --- Rendering ---
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGround();
    this.drawPath();
    this.drawGrid();

    // Ghost placement preview (range)
    if (this.placingDefId && this.hoverTile) {
      this.drawPlacementPreview();
    }

    // Range of selected tower
    if (this.selectedTower) {
      this.drawRange(this.selectedTower.x, this.selectedTower.y, this.selectedTower.range, '#06d6a0');
    }

    // Towers
    for (const t of this.towers) t.drawBase(ctx);

    // Enemies
    for (const e of this.enemies) e.draw(ctx);

    // Projectiles + FX
    for (const p of this.projectiles) p.draw(ctx);
    for (const f of this.fx) f.draw(ctx);

    if (this.paused) this.drawPausedOverlay();
  }

  drawGround() {
    const ctx = this.ctx;
    // Checkerboard grass
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        ctx.fillStyle = (c + r) % 2 === 0 ? '#2a9d8f' : '#24867a';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  drawPath() {
    const ctx = this.ctx;
    // Draw dirt tiles under path first
    for (const k of this.pathTiles) {
      const [c, r] = k.split(',').map(Number);
      ctx.fillStyle = '#8d6748';
      ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    // Draw a smooth road on top
    ctx.strokeStyle = '#6b4f35';
    ctx.lineWidth = TILE_SIZE * 0.7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const p0 = PATH_POINTS[0];
    ctx.moveTo(p0.c * TILE_SIZE + TILE_SIZE / 2, p0.r * TILE_SIZE + TILE_SIZE / 2);
    for (let i = 1; i < PATH_POINTS.length; i++) {
      const p = PATH_POINTS[i];
      ctx.lineTo(p.c * TILE_SIZE + TILE_SIZE / 2, p.r * TILE_SIZE + TILE_SIZE / 2);
    }
    ctx.stroke();
    // Inner lighter stripe
    ctx.strokeStyle = '#a4794f';
    ctx.lineWidth = TILE_SIZE * 0.42;
    ctx.stroke();
    // Dashed midline
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Start and End markers
    const start = PATH_POINTS[0];
    const end = PATH_POINTS[PATH_POINTS.length - 1];
    const sx = Math.max(0, start.c) * TILE_SIZE + TILE_SIZE / 2;
    const sy = start.r * TILE_SIZE + TILE_SIZE / 2;
    const ex = Math.min(GRID_SIZE - 1, end.c) * TILE_SIZE + TILE_SIZE / 2;
    const ey = end.r * TILE_SIZE + TILE_SIZE / 2;
    ctx.fillStyle = '#06d6a0';
    ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef476f';
    ctx.beginPath(); ctx.arc(ex, ey, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', sx, sy);
    ctx.fillText('E', ex, ey);
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * TILE_SIZE, 0); ctx.lineTo(i * TILE_SIZE, GRID_SIZE * TILE_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * TILE_SIZE); ctx.lineTo(GRID_SIZE * TILE_SIZE, i * TILE_SIZE); ctx.stroke();
    }
  }

  drawPlacementPreview() {
    const ctx = this.ctx;
    const { c, r } = this.hoverTile;
    const def = getTowerDef(this.placingDefId);
    const valid = this.canPlaceAt(c, r, this.placingDefId);
    const cx = c * TILE_SIZE + TILE_SIZE / 2;
    const cy = r * TILE_SIZE + TILE_SIZE / 2;
    // Tile highlight
    ctx.fillStyle = valid ? 'rgba(6,214,160,0.35)' : 'rgba(239,71,111,0.35)';
    ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    // Range preview
    this.drawRange(cx, cy, def.range, valid ? '#06d6a0' : '#ef476f');

    // Ghost base
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = def.color;
    ctx.strokeStyle = def.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, cx, cy);
    ctx.restore();
  }

  drawRange(x, y, r, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.12;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawPausedOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    ctx.font = '16px sans-serif';
    ctx.fillText('Press Space or click Pause to resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
  }
}
