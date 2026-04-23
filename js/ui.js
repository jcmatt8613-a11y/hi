// UI: shop, abilities bar, wave preview, modals, stats.
import { TOWER_DEFS, getTowerDef, TARGET_MODES } from './towers.js';
import { TILE_SIZE } from './grid.js';
import { ABILITIES } from './abilities.js';
import { HEROES, getHeroDef } from './hero.js';
import { ENEMY_TYPES } from './enemies.js';
import { ACHIEVEMENTS } from './achievements.js';
import { DIFFICULTIES } from './highscores.js';
import { MAPS } from './maps.js';
import { previewWave } from './waves.js';

const ARCHETYPE_CATEGORIES = [
  { id: 'all',    name: 'All' },
  { id: 'basic',  name: 'Basic' },
  { id: 'rapid',  name: 'Rapid' },
  { id: 'sniper', name: 'Sniper' },
  { id: 'cannon', name: 'Cannon' },
  { id: 'flame',  name: 'Flame' },
  { id: 'frost',  name: 'Frost' },
  { id: 'poison', name: 'Poison' },
  { id: 'chain',  name: 'Chain' },
  { id: 'laser',  name: 'Laser' },
  { id: 'aa',     name: 'AA' },
  { id: 'aura',   name: 'Aura' },
  { id: 'econ',   name: 'Econ' },
];

export class UI {
  constructor() {
    this.shopEl = document.getElementById('tower-shop');
    this.searchEl = document.getElementById('tower-search');
    this.catEl = document.getElementById('tower-categories');
    this.selPanel = document.getElementById('selected-panel');
    this.selName = document.getElementById('sel-name');
    this.selStats = document.getElementById('sel-stats');
    this.upgradeBtn = document.getElementById('btn-upgrade');
    this.sellBtn = document.getElementById('btn-sell');
    this.targetBtn = document.getElementById('btn-target');
    this.heroPanel = document.getElementById('hero-panel');

    this.statWave = document.getElementById('stat-wave');
    this.statHealth = document.getElementById('stat-health');
    this.statMoney = document.getElementById('stat-money');
    this.statScore = document.getElementById('stat-score');
    this.banner = document.getElementById('wave-banner');
    this.tooltip = document.getElementById('tooltip');
    this.speedBtns = {
      1: document.getElementById('btn-speed-1'),
      2: document.getElementById('btn-speed-2'),
      4: document.getElementById('btn-speed-3'),
    };
    this.pauseBtn = document.getElementById('btn-pause');
    this.muteBtn = document.getElementById('btn-mute');
    this.menuBtn = document.getElementById('btn-menu');
    this.abilityBar = document.getElementById('ability-bar');
    this.wavePreview = document.getElementById('wave-preview');

    this.shopCards = new Map();
    this.gameRef = null;
    this.activeCategory = 'all';
  }

  bindGame(game) { this.gameRef = game; }

  renderCategories() {
    if (!this.catEl) return;
    this.catEl.innerHTML = '';
    for (const c of ARCHETYPE_CATEGORIES) {
      const b = document.createElement('button');
      b.className = 'cat-btn' + (c.id === this.activeCategory ? ' active' : '');
      b.textContent = c.name;
      b.addEventListener('click', () => {
        this.activeCategory = c.id;
        this.renderCategories();
        this.renderShop();
      });
      this.catEl.appendChild(b);
    }
  }

  renderShop() {
    const query = (this.searchEl.value || '').toLowerCase();
    this.shopEl.innerHTML = '';
    this.shopCards.clear();
    const frag = document.createDocumentFragment();

    // Heroes row first
    if (this.gameRef && this.gameRef.heroId && !this.gameRef.hero && (this.activeCategory === 'all')) {
      const def = getHeroDef(this.gameRef.heroId);
      if (def) {
        const card = document.createElement('div');
        card.className = 'tower-card hero-card';
        card.dataset.defId = 'hero:' + def.id;
        card.innerHTML = `
          <div class="tower-swatch hero-swatch" style="background:${def.color};border:2px solid ${def.stroke}">${def.icon}</div>
          <div class="tower-name">${def.name}</div>
          <div class="tower-price">$${def.cost}</div>
        `;
        card.addEventListener('click', () => {
          if (this.gameRef.money < def.cost) return;
          this.gameRef.selectShopHero();
          this.selectShopCard('hero:' + def.id);
        });
        card.addEventListener('mouseenter', () => this.showHeroTooltip(def, card));
        card.addEventListener('mouseleave', () => this.hideTooltip());
        frag.appendChild(card);
        this.shopCards.set('hero:' + def.id, card);
      }
    }

    for (const def of TOWER_DEFS) {
      if (this.activeCategory !== 'all' && def.archetype !== this.activeCategory) continue;
      if (query && !def.name.toLowerCase().includes(query) && !def.archetype.includes(query)) continue;
      const card = document.createElement('div');
      card.className = 'tower-card';
      card.dataset.defId = def.id;
      const badge = def.antiAir ? '<div class="badge">AA</div>' : (def.archetype === 'aura' ? '<div class="badge aura">AURA</div>' : (def.archetype === 'econ' ? '<div class="badge econ">$</div>' : ''));
      card.innerHTML = `
        ${badge}
        <div class="tower-swatch" style="background:${def.color};border:2px solid ${def.stroke}">${def.icon}</div>
        <div class="tower-name">${def.name}</div>
        <div class="tower-price">$${def.cost}</div>
      `;
      card.addEventListener('click', () => {
        if (!this.gameRef) return;
        if (this.gameRef.money < def.cost) return;
        this.gameRef.selectShopTower(def.id);
      });
      card.addEventListener('mouseenter', () => this.showShopTooltip(def, card));
      card.addEventListener('mouseleave', () => this.hideTooltip());
      frag.appendChild(card);
      this.shopCards.set(def.id, card);
    }
    this.shopEl.appendChild(frag);
    this.updateAffordability(this.gameRef ? this.gameRef.money : 0);
  }

  selectShopCard(defId) {
    for (const [id, el] of this.shopCards) {
      el.classList.toggle('selected', id === defId);
    }
  }

  updateAffordability(money) {
    for (const [id, el] of this.shopCards) {
      if (id.startsWith('hero:')) {
        const def = getHeroDef(id.slice(5));
        if (def) el.classList.toggle('unaffordable', money < def.cost);
        continue;
      }
      const def = getTowerDef(id);
      if (def) el.classList.toggle('unaffordable', money < def.cost);
    }
  }

  showShopTooltip(def, card) {
    const r = card.getBoundingClientRect();
    const host = this.tooltip.parentElement.getBoundingClientRect();
    const parts = [];
    parts.push(`<b>${def.name}</b>`);
    parts.push(`<span class="muted">${def.archetype.toUpperCase()}${def.antiAir ? ' · ANTI-AIR' : ''}</span>`);
    parts.push(`Cost: <b class="gold">$${def.cost}</b>`);
    if (def.damage) parts.push(`Damage: <b>${def.damage}</b>`);
    if (def.range) parts.push(`Range: <b>${(def.range / TILE_SIZE).toFixed(1)}</b> tiles`);
    if (def.cooldown && def.archetype !== 'econ' && def.archetype !== 'aura') parts.push(`Fire rate: <b>${(1000 / def.cooldown).toFixed(2)}</b>/s`);
    if (def.splash) parts.push(`Splash: <b>${(def.splash / TILE_SIZE).toFixed(1)}</b> tiles`);
    if (def.slow) parts.push(`Slow: <b>${Math.round((1 - def.slow) * 100)}%</b> for ${(def.slowDur/1000).toFixed(1)}s`);
    if (def.poisonDps) parts.push(`Poison: <b>${def.poisonDps}</b> dps for ${(def.poisonDur/1000).toFixed(1)}s`);
    if (def.burnDps) parts.push(`Burn: <b>${def.burnDps}</b> dps for ${(def.burnDur/1000).toFixed(1)}s`);
    if (def.chains) parts.push(`Chains: <b>${def.chains}</b> targets`);
    if (def.auraDmgMult) parts.push(`Aura: <b>+${Math.round((def.auraDmgMult - 1) * 100)}%</b> damage, <b>-${Math.round((1 - def.auraCdMult) * 100)}%</b> cooldown`);
    if (def.goldPer) parts.push(`Gold: <b>+$${def.goldPer}</b> every ${(def.cooldown / 1000).toFixed(0)}s`);
    this.tooltip.innerHTML = parts.join('<br>');
    this.tooltip.style.left = `${r.left - host.left - 230}px`;
    this.tooltip.style.top = `${r.top - host.top}px`;
    this.tooltip.classList.add('show');
  }

  showHeroTooltip(def, card) {
    const r = card.getBoundingClientRect();
    const host = this.tooltip.parentElement.getBoundingClientRect();
    const parts = [
      `<b>${def.name}</b>`,
      `<span class="muted">HERO</span>`,
      `Cost: <b class="gold">$${def.cost}</b>`,
      `Damage: <b>${def.baseDamage}</b>`,
      `Range: <b>${(def.range / TILE_SIZE).toFixed(1)}</b> tiles`,
      `Ability: <b>${def.ability.name}</b> — ${def.ability.description}`,
      def.description,
    ];
    this.tooltip.innerHTML = parts.join('<br>');
    this.tooltip.style.left = `${r.left - host.left - 230}px`;
    this.tooltip.style.top = `${r.top - host.top}px`;
    this.tooltip.classList.add('show');
  }

  hideTooltip() { this.tooltip.classList.remove('show'); }

  showSelectedTowerPanel(t, game) {
    this.heroPanel.classList.add('hidden');
    this.selPanel.classList.remove('hidden');
    this.selName.textContent = `${t.def.name} — Lv ${t.level}${t.auraActive ? ' ★' : ''}`;
    const upgCost = t.upgradeCost();
    const rows = [];
    rows.push(row('Archetype', t.def.archetype.toUpperCase() + (t.def.antiAir ? ' / AA' : '')));
    if (t.def.archetype !== 'econ' && t.def.archetype !== 'aura') {
      rows.push(row('Damage', t.damage.toFixed(1)));
      rows.push(row('Range', (t.range / TILE_SIZE).toFixed(1) + ' tiles'));
      rows.push(row('Fire rate', (1000 / t.cooldown).toFixed(2) + '/s'));
    }
    if (t.def.splash) rows.push(row('Splash', (t.splash / TILE_SIZE).toFixed(1) + ' tiles'));
    if (t.def.slow) rows.push(row('Slow', Math.round((1 - t.def.slow) * 100) + '%'));
    if (t.def.poisonDps) rows.push(row('Poison dps', t.poisonDps.toFixed(1)));
    if (t.def.burnDps) rows.push(row('Burn dps', t.burnDps.toFixed(1)));
    if (t.def.chains) rows.push(row('Chains', t.def.chains));
    if (t.def.auraDmgMult) rows.push(row('Aura', `+${Math.round((t.def.auraDmgMult - 1) * 100)}% dmg`));
    if (t.def.goldPer) rows.push(row('Gold gen', `$${t.def.goldPer * t.statMult().dmg} / ${(t.def.cooldown / 1000).toFixed(0)}s`));
    rows.push(row('Target', t.targetMode.toUpperCase()));
    rows.push(row('Kills', t.killCount));
    rows.push(row('Upgrade', t.level >= 5 ? 'MAX' : '$' + upgCost));
    rows.push(row('Sell value', '$' + t.sellValue()));
    this.selStats.innerHTML = rows.join('');
    this.upgradeBtn.disabled = t.level >= 5;
    this.upgradeBtn.textContent = t.level >= 5 ? 'Max Level' : `Upgrade ($${upgCost})`;
    this.sellBtn.textContent = `Sell ($${t.sellValue()})`;
    this.targetBtn.textContent = `Target: ${t.targetMode.toUpperCase()}`;
    const disallow = t.def.archetype === 'aura' || t.def.archetype === 'econ';
    this.targetBtn.disabled = disallow;
  }

  hideSelectedTowerPanel() { this.selPanel.classList.add('hidden'); }

  showHeroPanel(hero, game) {
    this.selPanel.classList.add('hidden');
    this.heroPanel.classList.remove('hidden');
    const now = game ? game.gameTime : 0;
    const cd = hero.abilityCooldown(now);
    const def = hero.def;
    document.getElementById('hero-name').textContent = `${def.name} — Lv ${hero.level}`;
    document.getElementById('hero-stats').innerHTML = [
      row('Damage', hero.damage.toFixed(1)),
      row('Range', (hero.range / TILE_SIZE).toFixed(1) + ' tiles'),
      row('Fire rate', (1000 / hero.cooldown).toFixed(2) + '/s'),
      row('XP', `${Math.floor(hero.xp)} / ${hero.xpForNextLevel()}`),
      row('Ability', `${def.ability.name} ${cd > 0 ? `(cd ${Math.ceil(cd / 1000)}s)` : '(ready)'}`),
    ].join('');
    document.getElementById('btn-hero-ability').disabled = cd > 0;
  }

  hideHeroPanel() { this.heroPanel.classList.add('hidden'); }

  updateStats(game) {
    this.statWave.textContent = game.wave;
    this.statHealth.textContent = game.health;
    this.statMoney.textContent = game.money;
    this.statScore.textContent = game.score;
  }

  showWaveBanner(wave, isBoss) {
    this.banner.textContent = isBoss ? `BOSS WAVE ${wave}` : `WAVE ${wave}`;
    this.banner.classList.toggle('boss', isBoss);
    this.banner.classList.add('show');
    clearTimeout(this._bannerT);
    this._bannerT = setTimeout(() => this.banner.classList.remove('show'), 1600);
  }

  renderWavePreview(nextWave) {
    if (!this.wavePreview) return;
    const counts = previewWave(nextWave);
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const isBoss = nextWave % 10 === 0;
    this.wavePreview.innerHTML = `
      <span class="wp-label">Next: Wave ${nextWave}${isBoss ? ' 👑' : ''}</span>
      <div class="wp-chips">
        ${entries.map(([id, n]) => {
          const t = ENEMY_TYPES[id];
          if (!t) return '';
          return `<span class="wp-chip" title="${t.name}" style="background:${t.color};border-color:${t.stroke}">${n}</span>`;
        }).join('')}
      </div>`;
  }

  updateAbilityBar(abilityState, money, gameTime = 0) {
    if (!this.abilityBar) return;
    // Cache DOM for abilities
    if (!this._abilityEls) {
      this._abilityEls = new Map();
      this.abilityBar.innerHTML = '';
      for (const ab of ABILITIES) {
        const el = document.createElement('button');
        el.className = 'ability-btn';
        el.innerHTML = `
          <div class="ab-icon" style="color:${ab.color}">${ab.icon}</div>
          <div class="ab-name">${ab.name}</div>
          <div class="ab-cost">$${ab.cost}</div>
          <div class="ab-cooldown"></div>
          <div class="ab-hotkey">${ab.hotkey.toUpperCase()}</div>
        `;
        el.title = `${ab.name}: ${ab.description} [${ab.hotkey.toUpperCase()}]`;
        el.addEventListener('click', () => this.gameRef.requestAbility(ab.id));
        this.abilityBar.appendChild(el);
        this._abilityEls.set(ab.id, el);
      }
    }
    const now = gameTime;
    for (const ab of ABILITIES) {
      const el = this._abilityEls.get(ab.id);
      const cd = abilityState.cooldownRemaining(ab.id, now);
      const ready = cd === 0 && money >= ab.cost;
      el.classList.toggle('ready', ready);
      el.classList.toggle('unaffordable', money < ab.cost);
      el.classList.toggle('armed', abilityState.armed === ab.id);
      const cdEl = el.querySelector('.ab-cooldown');
      if (cd > 0) {
        cdEl.textContent = Math.ceil(cd / 1000) + 's';
        cdEl.style.width = `${Math.min(100, 100 * cd / ab.cooldown)}%`;
        cdEl.classList.add('show');
      } else {
        cdEl.textContent = '';
        cdEl.classList.remove('show');
      }
    }
  }

  updateSpeedButtons(speed) {
    for (const [s, el] of Object.entries(this.speedBtns)) {
      el.classList.toggle('active', Number(s) === speed);
    }
  }

  updatePauseButton(paused) {
    this.pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    this.pauseBtn.classList.toggle('active', paused);
  }

  updateMuteButton(muted) {
    this.muteBtn.textContent = muted ? '🔇' : '🔊';
  }

  showGameOver(wave, victory, score, isNewRecord) {
    document.getElementById('gameover-title').textContent = victory ? 'Victory!' : 'Defeat!';
    document.getElementById('gameover-wave').textContent = wave;
    document.getElementById('gameover-score').textContent = score;
    const recEl = document.getElementById('gameover-record');
    if (recEl) recEl.textContent = isNewRecord ? 'New High Score!' : '';
    showScreen('gameover-screen');
  }

  renderMapPicker(container, game, onPick) {
    container.innerHTML = '';
    for (const m of MAPS) {
      const card = document.createElement('div');
      card.className = 'picker-card' + (m.id === game.mapId ? ' selected' : '');
      card.innerHTML = `
        <h4>${m.name}</h4>
        <p>${m.description}</p>
        <div class="picker-meta">Difficulty ${('★').repeat(Math.round(m.difficultyMod * 3))}</div>
      `;
      card.addEventListener('click', () => { onPick(m.id); });
      container.appendChild(card);
    }
  }

  renderDifficultyPicker(container, game, onPick) {
    container.innerHTML = '';
    for (const d of DIFFICULTIES) {
      const card = document.createElement('div');
      card.className = 'picker-card small' + (d.id === game.difficultyId ? ' selected' : '');
      card.innerHTML = `<h4>${d.name}</h4><p class="picker-meta">HP ×${d.hpMult.toFixed(2)} · Start $${d.startMoney}</p>`;
      card.addEventListener('click', () => onPick(d.id));
      container.appendChild(card);
    }
  }

  renderHeroPicker(container, game, onPick) {
    container.innerHTML = '';
    const none = document.createElement('div');
    none.className = 'picker-card small' + (!game.heroId ? ' selected' : '');
    none.innerHTML = `<h4>No Hero</h4><p class="picker-meta">Save $750+ and rely purely on towers.</p>`;
    none.addEventListener('click', () => onPick(null));
    container.appendChild(none);
    for (const h of HEROES) {
      const card = document.createElement('div');
      card.className = 'picker-card small' + (game.heroId === h.id ? ' selected' : '');
      card.innerHTML = `
        <h4>${h.icon} ${h.name}</h4>
        <p>${h.description}</p>
        <p class="picker-meta">Cost $${h.cost}</p>
      `;
      card.addEventListener('click', () => onPick(h.id));
      container.appendChild(card);
    }
  }

  renderAchievements(container, manager) {
    container.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
      const div = document.createElement('div');
      const got = manager.unlocked.has(a.id);
      div.className = 'ach-row' + (got ? ' done' : '');
      div.innerHTML = `<span class="ach-icon">${got ? '🏆' : '🔒'}</span><div><b>${a.name}</b><div class="muted">${a.description}</div></div>`;
      container.appendChild(div);
    }
  }

  renderHighscores(container, hs) {
    container.innerHTML = '';
    const all = hs.all();
    if (all.length === 0) {
      container.innerHTML = '<p class="muted">No records yet. Play a game!</p>';
      return;
    }
    const tbl = document.createElement('table');
    tbl.className = 'hs-table';
    tbl.innerHTML = `<thead><tr><th>Map</th><th>Difficulty</th><th>Mode</th><th>Wave</th><th>Score</th></tr></thead>`;
    const tb = document.createElement('tbody');
    for (const r of all.slice(0, 20)) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.map}</td><td>${r.diff}</td><td>${r.mode}</td><td>${r.wave}</td><td>${r.score}</td>`;
      tb.appendChild(tr);
    }
    tbl.appendChild(tb);
    container.appendChild(tbl);
  }
}

function row(key, val) {
  return `<div><span class="key">${key}:</span> <span class="val">${val}</span></div>`;
}

export function showScreen(id) {
  for (const el of document.querySelectorAll('.screen')) {
    el.classList.toggle('active', el.id === id);
  }
}
