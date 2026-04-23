// Main Game class. Manages state, entities, game loop, and rendering.
import {
  GRID_SIZE, TILE_SIZE, buildPathTiles, key,
  tileCenter, pixelToTile, buildPathSegments,
} from './grid.js';
import { Enemy, ENEMY_TYPES } from './enemies.js';
import { TOWER_DEFS, Tower, getTowerDef, TARGET_MODES } from './towers.js';
import { Projectile, FX } from './projectile.js';
import { generateWave, hpMultiplierForWave, previewWave } from './waves.js';
import { sfx, resumeAudio } from './sound.js';
import { ABILITIES, AbilityState } from './abilities.js';
import { Hero, getHeroDef } from './hero.js';
import { AchievementManager } from './achievements.js';
import { Highscores, getDifficulty } from './highscores.js';
import { getMap } from './maps.js';
import { Background } from './background.js';

const CRIT_CHANCE = 0.12;
const CRIT_MULT = 2.0;

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;

    this.achievements = new AchievementManager();
    this.highscores = new Highscores();
    this.boundLoop = this.loop.bind(this);
    this.lastTime = 0;
    this.running = false;

    // Defaults (re-applied in reset)
    this.mapId = 'meadow';
    this.difficultyId = 'normal';
    this.endless = false;
    this.heroId = null;

    this.reset();
    this.attachCanvasEvents();
  }

  reset() {
    const mapDef = getMap(this.mapId);
    const diff = getDifficulty(this.difficultyId);
    this.mapDef = mapDef;
    this.diff = diff;

    this.pathInfo = buildPathSegments(mapDef.path);
    this.pathTiles = buildPathTiles(mapDef.path);

    this.background = new Background(mapDef.theme);
    this.background.setWeather(weatherForMap(mapDef.id));

    this.health = 100;
    this.money = diff.startMoney;
    this.score = 0;
    this.wave = 0;
    this.enemies = [];
    this.projectiles = [];
    this.fx = [];
    this.towers = [];
    this.hero = null;
    this.towersByTile = new Map();
    this.selectedTower = null;
    this.selectedHero = false;
    this.placingDefId = null;
    this.placingHero = false;
    this.hoverTile = null;
    this.mouse = { x: -1, y: -1 };
    this.speed = 1;
    this.paused = false;
    this.gameOver = false;

    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveActive = false;
    this.betweenWaveTimer = 2500;
    this.hpMult = 1;

    this.abilityState = new AbilityState();

    this.econTimers = new Map(); // tower -> lastTickTime

    // Run stats for achievements
    this.stats = {
      kills: 0,
      bossKills: 0,
      wavesReached: 0,
      cleanWaves: 0,
      leaksThisWave: 0,
      uniqueTowers: 0,
      _uniqueSet: new Set(),
      maxTowerLevel: 1,
      peakMoney: diff.startMoney,
      minHealth: 100,
      killsByArchetype: {},
      abilitiesUsed: 0,
      heroMaxLevel: 0,
      mapsWon: (this.stats && this.stats.mapsWon) || [],
    };
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

  // --- Placement / selection ---
  selectShopTower(defId) {
    this.placingDefId = defId;
    this.placingHero = false;
    this.selectedTower = null;
    this.ui.selectShopCard(defId);
    this.ui.hideSelectedTowerPanel();
  }

  selectShopHero() {
    this.placingHero = true;
    this.placingDefId = null;
    this.selectedTower = null;
    this.ui.hideSelectedTowerPanel();
  }

  cancelPlacement() {
    this.placingDefId = null;
    this.placingHero = false;
    this.ui.selectShopCard(null);
  }

  selectPlacedTower(tower) {
    this.selectedTower = tower;
    this.placingDefId = null;
    this.placingHero = false;
    this.ui.selectShopCard(null);
    this.ui.showSelectedTowerPanel(tower, this);
  }

  canPlaceAt(c, r, defId) {
    if (c < 0 || c >= GRID_SIZE || r < 0 || r >= GRID_SIZE) return false;
    if (this.pathTiles.has(key(c, r))) return false;
    if (this.towersByTile.has(key(c, r))) return false;
    if (this.hero && this.hero.c === c && this.hero.r === r) return false;
    const def = getTowerDef(defId);
    if (!def) return false;
    if (this.money < def.cost) return false;
    return true;
  }

  canPlaceHeroAt(c, r) {
    if (this.hero) return false;
    if (c < 0 || c >= GRID_SIZE || r < 0 || r >= GRID_SIZE) return false;
    if (this.pathTiles.has(key(c, r))) return false;
    if (this.towersByTile.has(key(c, r))) return false;
    const def = getHeroDef(this.heroId);
    if (!def) return false;
    return this.money >= def.cost;
  }

  placeTower(c, r) {
    if (!this.placingDefId) return;
    if (!this.canPlaceAt(c, r, this.placingDefId)) { sfx.error(); return; }
    const def = getTowerDef(this.placingDefId);
    this.money -= def.cost;
    const t = new Tower(this.placingDefId, c, r);
    this.towers.push(t);
    this.towersByTile.set(key(c, r), t);
    this.stats._uniqueSet.add(def.id);
    this.stats.uniqueTowers = this.stats._uniqueSet.size;
    sfx.place();
    this.placingDefId = null;
    this.ui.selectShopCard(null);
    this.recomputeAuras();
    this.ui.updateAffordability(this.money);
    this.ui.updateStats(this);
  }

  placeHero(c, r) {
    if (!this.placingHero) return;
    if (!this.canPlaceHeroAt(c, r)) { sfx.error(); return; }
    const def = getHeroDef(this.heroId);
    this.money -= def.cost;
    this.hero = new Hero(this.heroId, c, r);
    this.placingHero = false;
    sfx.place();
    this.ui.updateAffordability(this.money);
    this.ui.updateStats(this);
  }

  upgradeSelected() {
    const t = this.selectedTower;
    if (!t) return;
    if (t.level >= 5) { sfx.error(); return; }
    const cost = t.upgradeCost();
    if (this.money < cost) { sfx.error(); return; }
    this.money -= cost;
    t.tryUpgrade();
    this.stats.maxTowerLevel = Math.max(this.stats.maxTowerLevel, t.level);
    this.recomputeAuras();
    sfx.upgrade();
    this.ui.updateStats(this);
    this.ui.showSelectedTowerPanel(t, this);
    this.ui.updateAffordability(this.money);
  }

  sellSelected() {
    const t = this.selectedTower;
    if (!t) return;
    this.money += t.sellValue();
    this.towers = this.towers.filter(x => x !== t);
    this.towersByTile.delete(key(t.c, t.r));
    this.selectedTower = null;
    this.recomputeAuras();
    sfx.sell();
    this.ui.hideSelectedTowerPanel();
    this.ui.updateStats(this);
    this.ui.updateAffordability(this.money);
  }

  cycleTargetMode() {
    const t = this.selectedTower;
    if (!t) return;
    t.cycleTargetMode();
    this.ui.showSelectedTowerPanel(t, this);
  }

  recomputeAuras() {
    // Reset all buffs
    for (const t of this.towers) {
      t.auraDmgMult = 1; t.auraCdMult = 1; t.auraRangeMult = 1; t.auraActive = false;
    }
    for (const aura of this.towers) {
      if (aura.def.archetype !== 'aura') continue;
      const r = aura.range;
      for (const t of this.towers) {
        if (t === aura) continue;
        if (t.def.archetype === 'aura' || t.def.archetype === 'econ') continue;
        const d = Math.hypot(aura.x - t.x, aura.y - t.y);
        if (d <= r) {
          t.auraDmgMult *= aura.def.auraDmgMult || 1;
          t.auraCdMult *= aura.def.auraCdMult || 1;
          t.auraRangeMult *= aura.def.auraRangeMult || 1;
          t.auraActive = true;
        }
      }
    }
  }

  startNextWave() {
    this.wave += 1;
    this.stats.wavesReached = Math.max(this.stats.wavesReached, this.wave);
    this.stats.leaksThisWave = 0;
    // Scale: difficulty * map modifier * wave progression.
    let hpMult = hpMultiplierForWave(this.wave) * this.diff.hpMult * (this.mapDef.enemyHpMult || 1);
    const speedMult = this.diff.speedMult * (this.mapDef.enemySpeedMult || 1);
    const rewardMult = this.diff.moneyMult * (this.mapDef.rewardMult || 1);
    if (this.endless && this.wave > 40) {
      hpMult *= Math.pow(1.05, this.wave - 40);
    }
    this.hpMult = hpMult;
    this.speedMult = speedMult;
    this.rewardMult = rewardMult;
    const entries = generateWave(this.wave);
    this.spawnQueue = entries.slice();
    this.spawnTimer = 0;
    this.waveActive = true;
    const isBoss = this.wave % 10 === 0;
    this.ui.showWaveBanner(this.wave, isBoss);
    this.ui.renderWavePreview(this.wave + 1);
    if (isBoss) sfx.boss(); else sfx.wave();
    this.ui.updateStats(this);
  }

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
      if (this.abilityState.armed) {
        this.triggerAbility(this.abilityState.armed, x, y);
        return;
      }
      const tile = pixelToTile(x, y);
      if (!tile) return;
      if (this.placingDefId) { this.placeTower(tile.c, tile.r); return; }
      if (this.placingHero) { this.placeHero(tile.c, tile.r); return; }
      // Select existing tower
      const existing = this.towersByTile.get(key(tile.c, tile.r));
      if (existing) { this.selectPlacedTower(existing); return; }
      if (this.hero && this.hero.c === tile.c && this.hero.r === tile.r) {
        this.ui.showHeroPanel(this.hero, this);
        this.selectedHero = true;
        return;
      }
      this.selectedTower = null;
      this.selectedHero = false;
      this.ui.hideSelectedTowerPanel();
      this.ui.hideHeroPanel();
    });
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.cancelPlacement();
      this.abilityState.cancel();
      this.selectedTower = null;
      this.ui.hideSelectedTowerPanel();
      this.ui.hideHeroPanel();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.cancelPlacement();
        this.abilityState.cancel();
        this.selectedTower = null;
        this.ui.hideSelectedTowerPanel();
        this.ui.hideHeroPanel();
      }
      if (e.key === ' ') { e.preventDefault(); this.togglePause(); }
      if (e.key === '1') this.setSpeed(1);
      if (e.key === '2') this.setSpeed(2);
      if (e.key === '3') this.setSpeed(4);
      if (e.key.toLowerCase() === 'u' && this.selectedTower) this.upgradeSelected();
      if (e.key.toLowerCase() === 's' && this.selectedTower) this.sellSelected();
      if (e.key.toLowerCase() === 't' && this.selectedTower) this.cycleTargetMode();
      // Ability hotkeys
      for (const ab of ABILITIES) {
        if (e.key.toLowerCase() === ab.hotkey) this.requestAbility(ab.id);
      }
      if (e.key.toLowerCase() === 'h' && this.hero && this.hero.canUseAbility(performance.now())) {
        this.useHeroAbility();
      }
    });
  }

  requestAbility(id) {
    const ab = ABILITIES.find(a => a.id === id);
    if (!ab) return;
    const now = performance.now();
    if (!this.abilityState.isReady(id, now)) { sfx.error(); return; }
    if (this.money < ab.cost) { sfx.error(); return; }
    if (ab.requiresTarget) {
      this.abilityState.arm(id);
    } else {
      this.triggerAbility(id, 300, 300);
    }
  }

  triggerAbility(id, x, y) {
    const ab = ABILITIES.find(a => a.id === id);
    if (!ab) return;
    const now = performance.now();
    if (!this.abilityState.isReady(id, now)) { sfx.error(); return; }
    if (this.money < ab.cost) { sfx.error(); return; }
    this.money -= ab.cost;
    this.abilityState.markUsed(id, now);
    this.stats.abilitiesUsed += 1;
    if (id === 'fireball') {
      const r = ab.radius;
      this.fx.push(new FX('explosion', { x, y, radius: r, color: ab.color, duration: 420 }));
      this.fx.push(new FX('ring', { x, y, radius: r + 12, color: ab.color, duration: 380 }));
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - x, e.y - y);
        if (d <= r) {
          e.takeDamage(ab.damage, { pierce: true });
          e.applyBurn(ab.burnDps, ab.burnDur, now);
        }
      }
      sfx.cannon();
    } else if (id === 'ice_nova') {
      this.fx.push(new FX('ring', { x: 300, y: 300, radius: 360, color: ab.color, duration: 500 }));
      for (const e of this.enemies) {
        if (!e.alive) continue;
        e.takeDamage(ab.damage, { pierce: true });
        e.applySlow(ab.slow, ab.slowDur, now);
        e.applyStun(ab.freezeDur, now);
      }
      sfx.freeze();
    } else if (id === 'gold_rush') {
      const gain = 300 + this.wave * 25;
      this.money += gain;
      this.fx.push(new FX('text', { x: 300, y: 300, text: `+$${gain}`, color: '#ffd60a', duration: 900, font: 'bold 32px sans-serif' }));
      sfx.upgrade();
    } else if (id === 'lightning_storm') {
      const alive = this.enemies.filter(e => e.alive);
      const n = Math.min(ab.strikes, alive.length);
      for (let i = 0; i < n; i++) {
        const target = alive[Math.floor(Math.random() * alive.length)];
        if (!target) continue;
        target.takeDamage(ab.damage, { pierce: true });
        target.applyStun(ab.stunDur, now);
        this.fx.push(new FX('lightning', {
          points: [{ x: target.x, y: -20 }, { x: target.x + (Math.random() - 0.5) * 14, y: target.y - 80 }, { x: target.x, y: target.y }],
          color: '#ffd166', duration: 220,
        }));
      }
      sfx.zap();
    }
    this.ui.updateStats(this);
  }

  useHeroAbility() {
    if (!this.hero) return;
    const now = performance.now();
    if (!this.hero.canUseAbility(now)) { sfx.error(); return; }
    this.hero.lastAbility = now;
    const abDef = this.hero.def;
    if (this.hero.defId === 'knight') {
      // Whirlwind: big splash at hero
      const r = this.hero.range * 2;
      this.fx.push(new FX('explosion', { x: this.hero.x, y: this.hero.y, radius: r, color: '#f94144', duration: 450 }));
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - this.hero.x, e.y - this.hero.y);
        if (d <= r) e.takeDamage(this.hero.damage * 4, { pierce: true });
      }
    } else if (this.hero.defId === 'archer') {
      // Rain of Arrows: random strikes across map
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 600;
        const y = Math.random() * 600;
        this.fx.push(new FX('explosion', { x, y, radius: 18, color: '#52b788', duration: 220 }));
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (Math.hypot(e.x - x, e.y - y) < 18) e.takeDamage(this.hero.damage * 1.2, { pierce: true });
        }
      }
    } else if (this.hero.defId === 'mage') {
      // Blizzard: slow all + damage
      this.fx.push(new FX('ring', { x: 300, y: 300, radius: 380, color: '#90e0ef', duration: 600 }));
      for (const e of this.enemies) {
        if (!e.alive) continue;
        e.takeDamage(this.hero.damage * 2, { pierce: true });
        e.applySlow(0.4, 3500, now);
      }
    }
    sfx.zap();
  }

  loop(now) {
    if (!this.running) return;
    const realDt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    if (!this.paused && !this.gameOver) {
      const dt = realDt * this.speed;
      this.update(dt, now);
    }
    this.background.update(realDt * (this.paused ? 0 : this.speed));
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
        const e = new Enemy(entry.type, this.pathInfo, {
          hpScale: this.hpMult,
          speedScale: this.speedMult,
          rewardScale: this.rewardMult,
        });
        this.enemies.push(e);
        this.spawnTimer += entry.delay;
      }
      if (this.spawnQueue.length === 0 && this.enemies.length === 0) {
        this.waveActive = false;
        if (this.stats.leaksThisWave === 0) this.stats.cleanWaves += 1;
        const bonus = Math.round((40 + this.wave * 8) * this.rewardMult);
        this.money += bonus;
        this.score += bonus;
        this.fx.push(new FX('text', { x: 300, y: 300, text: `Wave clear! +$${bonus}`, color: '#06d6a0', duration: 1400, font: 'bold 22px sans-serif' }));
        this.betweenWaveTimer = 2200;
        this.ui.updateAffordability(this.money);
      }
    }

    // Healers heal nearby enemies
    for (const h of this.enemies) {
      if (!h.alive || !h.type.healDps || !h.type.healRadius) continue;
      for (const e of this.enemies) {
        if (e === h || !e.alive) continue;
        const d = Math.hypot(e.x - h.x, e.y - h.y);
        if (d <= h.type.healRadius) {
          e.hp = Math.min(e.maxHp, e.hp + h.type.healDps * dt);
        }
      }
    }

    for (const e of this.enemies) e.update(dt, now);

    // Handle splits (on death) and deaths
    const survivors = [];
    const toSpawn = [];
    for (const e of this.enemies) {
      if (!e.alive && e.reachedEnd) {
        this.health -= e.type.dmg;
        this.stats.leaksThisWave += 1;
        sfx.leak();
        if (this.health <= 0) { this.health = 0; this.endGame(false); }
      } else if (!e.alive) {
        this.money += e.reward;
        this.score += e.reward;
        this.stats.kills += 1;
        if (e.isBoss) this.stats.bossKills += 1;
        if (e.type.boss) sfx.bossDie(); else sfx.enemyDie();
        this.fx.push(new FX('explosion', { x: e.x, y: e.y, radius: e.type.size + 6, color: e.type.color, duration: 240 }));
        this.fx.push(new FX('dmgnumber', { x: e.x, y: e.y, text: `+$${e.reward}`, color: '#ffd60a', duration: 900 }));
        if (e.type.splits && e.type.splitCount) {
          for (let i = 0; i < e.type.splitCount; i++) {
            // Spawn child enemies slightly behind e's progress.
            const ne = new Enemy(e.type.splits, this.pathInfo, {
              hpScale: this.hpMult * 0.35,
              speedScale: this.speedMult,
              rewardScale: this.rewardMult,
              startDist: Math.max(0, e.dist - 20 - i * 12),
            });
            toSpawn.push(ne);
          }
        }
        if (this.hero) {
          const xp = e.type.boss ? 150 : 10 + (e.type.size || 0);
          this.hero.addXp(xp);
          this.stats.heroMaxLevel = Math.max(this.stats.heroMaxLevel, this.hero.level);
        }
      } else {
        survivors.push(e);
      }
    }
    this.enemies = survivors.concat(toSpawn);

    // Towers fire
    for (const t of this.towers) {
      if (t.def.archetype === 'econ') this.econTick(t, dt, now);
      else this.towerFire(t, now);
    }
    // Hero fires
    if (this.hero) this.heroFire(this.hero, now);

    // Projectiles
    for (const p of this.projectiles) p.update(dt, this.enemies, now);
    this.projectiles = this.projectiles.filter(p => p.alive);

    // FX
    for (const f of this.fx) f.update();
    this.fx = this.fx.filter(f => f.alive);

    // Stats tracking
    this.stats.peakMoney = Math.max(this.stats.peakMoney, this.money);
    this.stats.minHealth = Math.min(this.stats.minHealth, this.health);
    const unlocks = this.achievements.check(this.stats);
    for (const a of unlocks) {
      this.fx.push(new FX('text', { x: 300, y: 260, text: `Achievement: ${a.name}`, color: '#ffd60a', duration: 1600, font: 'bold 18px sans-serif' }));
      this.fx.push(new FX('text', { x: 300, y: 280, text: a.description, color: '#fff', duration: 1600, font: '13px sans-serif' }));
    }

    this.ui.updateStats(this);
    this.ui.updateAffordability(this.money);
    this.ui.updateAbilityBar(this.abilityState, this.money);
  }

  econTick(t, dt, now) {
    const last = this.econTimers.get(t) || now;
    if (now - last >= t.def.cooldown * t.statMult().cd) {
      const amount = t.def.goldPer * t.statMult().dmg;
      this.money += amount;
      this.score += Math.round(amount * 0.5);
      this.fx.push(new FX('dmgnumber', { x: t.x, y: t.y - 6, text: `+$${Math.round(amount)}`, color: '#ffd60a', duration: 900 }));
      this.econTimers.set(t, now);
    } else if (!this.econTimers.has(t)) {
      this.econTimers.set(t, now);
    }
  }

  pickTarget(tower) {
    let candidates = this.enemies.filter(e => e.alive && tower.canTarget(e) && ((e.x - tower.x) ** 2 + (e.y - tower.y) ** 2) <= tower.range * tower.range);
    if (candidates.length === 0) return null;
    const mode = tower.targetMode;
    if (mode === 'first') candidates.sort((a, b) => b.dist - a.dist);
    else if (mode === 'last') candidates.sort((a, b) => a.dist - b.dist);
    else if (mode === 'strong') candidates.sort((a, b) => b.hp - a.hp);
    else if (mode === 'close') {
      candidates.sort((a, b) => (a.x - tower.x) ** 2 + (a.y - tower.y) ** 2 - ((b.x - tower.x) ** 2 + (b.y - tower.y) ** 2));
    }
    return candidates[0];
  }

  towerFire(tower, now) {
    if (tower.def.archetype === 'aura' || tower.def.archetype === 'econ') return;
    const arche = tower.def.archetype;
    const target = this.pickTarget(tower);
    if (target) {
      const ang = Math.atan2(target.y - tower.y, target.x - tower.x);
      const diff = ((ang - tower.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      tower.angle += diff * 0.35;
    }
    if (!target) return;
    if (now - tower.lastShot < tower.cooldown) return;
    tower.lastShot = now;

    const color = tower.def.color;
    let dmg = tower.damageFor(target);
    let isCrit = false;
    if (Math.random() < CRIT_CHANCE) { dmg *= CRIT_MULT; isCrit = true; }

    const applyHit = (proj, enemies, ts, hits) => {
      for (const h of hits) {
        const e = h.enemy;
        this.fx.push(new FX('dmgnumber', { x: e.x, y: e.y - 8, text: isCrit ? `${Math.round(h.applied)}!` : `${Math.round(h.applied)}`, color: isCrit ? '#ffd60a' : '#fff', crit: isCrit, duration: isCrit ? 900 : 700 }));
        if (!e.alive) {
          tower.killCount += 1;
          const a = tower.def.archetype;
          this.stats.killsByArchetype[a] = (this.stats.killsByArchetype[a] || 0) + 1;
        }
      }
    };

    if (arche === 'basic' || arche === 'rapid' || arche === 'sniper' || arche === 'aa') {
      this.projectiles.push(new Projectile({
        x: tower.x, y: tower.y, target,
        speed: arche === 'sniper' ? 720 : (arche === 'rapid' ? 520 : 460),
        damage: dmg, color, pierce: tower.pierce, isCrit,
        onHit: applyHit,
      }));
      this.fx.push(new FX('muzzle', { x: tower.x + Math.cos(tower.angle) * 14, y: tower.y + Math.sin(tower.angle) * 14, color, duration: 120 }));
      if (arche === 'sniper') {
        this.fx.push(new FX('beam', { x1: tower.x, y1: tower.y, x2: target.x, y2: target.y, color: '#cfe8ff', duration: 120 }));
      }
      sfx.shoot();
    } else if (arche === 'cannon' || arche === 'flame') {
      this.projectiles.push(new Projectile({
        x: tower.x, y: tower.y, target,
        speed: arche === 'flame' ? 420 : 360, damage: dmg, color,
        splash: tower.splash, isCrit,
        onHit: (proj, enemies, ts, hits) => {
          this.fx.push(new FX('explosion', { x: proj.x, y: proj.y, radius: tower.splash, color, duration: 260 }));
          if (arche === 'flame') {
            for (const h of hits) {
              if (h.enemy.alive) h.enemy.applyBurn(tower.burnDps, tower.burnDur, ts);
            }
          }
          applyHit(proj, enemies, ts, hits);
        },
      }));
      if (arche === 'flame') sfx.laser(); else sfx.cannon();
    } else if (arche === 'frost') {
      this.projectiles.push(new Projectile({
        x: tower.x, y: tower.y, target,
        speed: 500, damage: dmg, color, isCrit,
        onHit: (proj, enemies, ts, hits) => {
          const r = TILE_SIZE * 1.2;
          for (const e of this.enemies) {
            if (!e.alive) continue;
            const d = Math.hypot(e.x - proj.x, e.y - proj.y);
            if (d <= r) e.applySlow(tower.slow, tower.slowDur, ts);
          }
          applyHit(proj, enemies, ts, hits);
        },
      }));
      sfx.freeze();
    } else if (arche === 'poison') {
      this.projectiles.push(new Projectile({
        x: tower.x, y: tower.y, target,
        speed: 460, damage: dmg, color, isCrit,
        onHit: (proj, enemies, ts, hits) => {
          const r = TILE_SIZE * 1.0;
          for (const e of this.enemies) {
            if (!e.alive) continue;
            const d = Math.hypot(e.x - proj.x, e.y - proj.y);
            if (d <= r) e.applyPoison(tower.poisonDps, tower.poisonDur, ts);
          }
          applyHit(proj, enemies, ts, hits);
        },
      }));
      sfx.poison();
    } else if (arche === 'chain') {
      const hit = new Set([target]);
      let cur = target;
      let curDmg = dmg;
      const points = [{ x: tower.x, y: tower.y }];
      for (let i = 0; i <= tower.chains; i++) {
        if (!cur || !cur.alive) break;
        const applied = cur.takeDamage(curDmg, { pierce: tower.pierce });
        this.fx.push(new FX('dmgnumber', { x: cur.x, y: cur.y - 8, text: `${Math.round(applied)}`, color: '#fff3b0', duration: 600 }));
        if (!cur.alive) {
          tower.killCount += 1;
          this.stats.killsByArchetype.chain = (this.stats.killsByArchetype.chain || 0) + 1;
        }
        points.push({ x: cur.x, y: cur.y });
        curDmg *= 0.75;
        let next = null; let nd = Infinity;
        for (const e of this.enemies) {
          if (!e.alive || hit.has(e)) continue;
          const d = Math.hypot(e.x - cur.x, e.y - cur.y);
          if (d <= tower.chainRange && d < nd) { next = e; nd = d; }
        }
        cur = next; if (cur) hit.add(cur);
      }
      const jitter = points.map((p, i) => (i === 0 || i === points.length - 1) ? p : { x: p.x + (Math.random() - 0.5) * 8, y: p.y + (Math.random() - 0.5) * 8 });
      this.fx.push(new FX('lightning', { points: jitter, color, duration: 180 }));
      sfx.zap();
    } else if (arche === 'laser') {
      const applied = target.takeDamage(dmg, { pierce: tower.pierce });
      this.fx.push(new FX('dmgnumber', { x: target.x, y: target.y - 8, text: `${Math.round(applied)}`, color, duration: 500 }));
      this.fx.push(new FX('beam', { x1: tower.x, y1: tower.y, x2: target.x, y2: target.y, color, duration: 90 }));
      if (!target.alive) {
        tower.killCount += 1;
        this.stats.killsByArchetype.laser = (this.stats.killsByArchetype.laser || 0) + 1;
      }
      sfx.laser();
    }
  }

  heroFire(hero, now) {
    // Pick target
    const target = this.pickHeroTarget(hero);
    if (target) {
      const ang = Math.atan2(target.y - hero.y, target.x - hero.x);
      const diff = ((ang - hero.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      hero.angle += diff * 0.4;
    }
    if (!target) return;
    if (now - hero.lastShot < hero.cooldown) return;
    hero.lastShot = now;
    const dmg = hero.damage;
    if (hero.defId === 'knight') {
      // Splash slash
      this.projectiles.push(new Projectile({
        x: hero.x, y: hero.y, target, speed: 520,
        damage: dmg, color: hero.def.color, splash: hero.def.splash,
        onHit: (proj, enemies, ts, hits) => {
          this.fx.push(new FX('explosion', { x: proj.x, y: proj.y, radius: hero.def.splash, color: hero.def.color, duration: 240 }));
          for (const h of hits) this.fx.push(new FX('dmgnumber', { x: h.enemy.x, y: h.enemy.y - 8, text: `${Math.round(h.applied)}`, color: '#fff', duration: 600 }));
        },
      }));
    } else if (hero.defId === 'archer') {
      this.projectiles.push(new Projectile({
        x: hero.x, y: hero.y, target, speed: 820,
        damage: dmg, color: hero.def.color, pierce: true,
        onHit: (p, es, ts, hits) => { for (const h of hits) this.fx.push(new FX('dmgnumber', { x: h.enemy.x, y: h.enemy.y - 8, text: `${Math.round(h.applied)}`, color: '#fff', duration: 600 })); },
      }));
      this.fx.push(new FX('beam', { x1: hero.x, y1: hero.y, x2: target.x, y2: target.y, color: '#d8f3dc', duration: 100 }));
    } else if (hero.defId === 'mage') {
      // Chain lightning
      const hit = new Set([target]);
      let cur = target;
      let d = dmg;
      const points = [{ x: hero.x, y: hero.y }];
      for (let i = 0; i <= hero.def.chains; i++) {
        if (!cur || !cur.alive) break;
        const applied = cur.takeDamage(d);
        this.fx.push(new FX('dmgnumber', { x: cur.x, y: cur.y - 8, text: `${Math.round(applied)}`, color: '#c8b6ff', duration: 500 }));
        points.push({ x: cur.x, y: cur.y });
        d *= 0.8;
        let next = null, nd = Infinity;
        for (const e of this.enemies) {
          if (!e.alive || hit.has(e)) continue;
          const ed = Math.hypot(e.x - cur.x, e.y - cur.y);
          if (ed <= hero.def.chainRange && ed < nd) { next = e; nd = ed; }
        }
        cur = next; if (cur) hit.add(cur);
      }
      this.fx.push(new FX('lightning', { points, color: hero.def.color, duration: 180 }));
    }
    sfx.shoot();
  }

  pickHeroTarget(hero) {
    let candidates = this.enemies.filter(e => e.alive && ((e.x - hero.x) ** 2 + (e.y - hero.y) ** 2) <= hero.range * hero.range);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.dist - a.dist);
    return candidates[0];
  }

  endGame(victory) {
    this.gameOver = true;
    if (victory) {
      if (!this.stats.mapsWon.includes(this.mapId)) this.stats.mapsWon.push(this.mapId);
    }
    sfx.gameOver();
    const isNew = this.highscores.report(this.mapId, this.difficultyId, this.endless ? 'endless' : 'standard', this.score, this.wave);
    this.achievements.check(this.stats);
    this.ui.showGameOver(this.wave, victory, this.score, isNew);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.background.drawSky(ctx, this.canvas.width, this.canvas.height);
    this.drawGround();
    this.drawPath();
    this.drawGrid();

    if ((this.placingDefId || this.placingHero) && this.hoverTile) {
      this.drawPlacementPreview();
    }
    if (this.selectedTower) {
      this.drawRange(this.selectedTower.x, this.selectedTower.y, this.selectedTower.range, '#06d6a0');
    }

    // Aura rings for aura towers (always visible, dim)
    for (const t of this.towers) {
      if (t.def.archetype === 'aura') this.drawRange(t.x, t.y, t.range, '#ffd60a', 0.08, 0.3);
    }

    for (const t of this.towers) t.drawBase(ctx);
    if (this.hero) this.hero.draw(ctx);
    for (const e of this.enemies) e.draw(ctx);
    for (const p of this.projectiles) p.draw(ctx);
    for (const f of this.fx) f.draw(ctx);

    // Foreground weather
    this.background.drawForeground(ctx);

    // Ability target cursor
    if (this.abilityState.armed) {
      const ab = ABILITIES.find(a => a.id === this.abilityState.armed);
      if (ab && this.mouse.x >= 0) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = ab.color;
        ctx.beginPath(); ctx.arc(this.mouse.x, this.mouse.y, ab.radius || 40, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = ab.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.arc(this.mouse.x, this.mouse.y, ab.radius || 40, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    if (this.paused) this.drawPausedOverlay();
  }

  drawGround() {
    const ctx = this.ctx;
    const th = this.mapDef.theme;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        ctx.fillStyle = (c + r) % 2 === 0 ? th.grassA : th.grassB;
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  drawPath() {
    const ctx = this.ctx;
    const th = this.mapDef.theme;
    const points = this.mapDef.path;
    for (const k of this.pathTiles) {
      const [c, r] = k.split(',').map(Number);
      ctx.fillStyle = th.pathA;
      ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    ctx.strokeStyle = th.pathB;
    ctx.lineWidth = TILE_SIZE * 0.7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const p0 = points[0];
    ctx.moveTo(p0.c * TILE_SIZE + TILE_SIZE / 2, p0.r * TILE_SIZE + TILE_SIZE / 2);
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      ctx.lineTo(p.c * TILE_SIZE + TILE_SIZE / 2, p.r * TILE_SIZE + TILE_SIZE / 2);
    }
    ctx.stroke();
    ctx.strokeStyle = th.pathInner;
    ctx.lineWidth = TILE_SIZE * 0.42;
    ctx.stroke();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.lineDashOffset = -(performance.now() / 40) % 12;
    ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;

    const start = points[0];
    const end = points[points.length - 1];
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
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * TILE_SIZE, 0); ctx.lineTo(i * TILE_SIZE, GRID_SIZE * TILE_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * TILE_SIZE); ctx.lineTo(GRID_SIZE * TILE_SIZE, i * TILE_SIZE); ctx.stroke();
    }
  }

  drawPlacementPreview() {
    const ctx = this.ctx;
    const { c, r } = this.hoverTile;
    const cx = c * TILE_SIZE + TILE_SIZE / 2;
    const cy = r * TILE_SIZE + TILE_SIZE / 2;
    if (this.placingDefId) {
      const def = getTowerDef(this.placingDefId);
      const valid = this.canPlaceAt(c, r, this.placingDefId);
      ctx.fillStyle = valid ? 'rgba(6,214,160,0.35)' : 'rgba(239,71,111,0.35)';
      ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      this.drawRange(cx, cy, def.range, valid ? '#06d6a0' : '#ef476f');
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
    } else if (this.placingHero) {
      const def = getHeroDef(this.heroId);
      if (!def) return;
      const valid = this.canPlaceHeroAt(c, r);
      ctx.fillStyle = valid ? 'rgba(6,214,160,0.35)' : 'rgba(239,71,111,0.35)';
      ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      this.drawRange(cx, cy, def.range, valid ? '#ffd60a' : '#ef476f');
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(def.icon, cx, cy);
    }
  }

  drawRange(x, y, r, color, fillAlpha = 0.12, strokeAlpha = 0.5) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = fillAlpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = strokeAlpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawPausedOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
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

function weatherForMap(id) {
  if (id === 'glacier') return 'snow';
  if (id === 'scorched') return 'embers';
  if (id === 'abyss') return 'stars';
  return 'none';
}
