// UI: shop rendering, stats, screens, tower selection panel.
import { TOWER_DEFS, getTowerDef } from './towers.js';
import { TILE_SIZE } from './grid.js';

export class UI {
  constructor() {
    this.shopEl = document.getElementById('tower-shop');
    this.searchEl = document.getElementById('tower-search');
    this.selPanel = document.getElementById('selected-panel');
    this.selName = document.getElementById('sel-name');
    this.selStats = document.getElementById('sel-stats');
    this.upgradeBtn = document.getElementById('btn-upgrade');
    this.sellBtn = document.getElementById('btn-sell');
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

    this.shopCards = new Map(); // defId -> element
    this.gameRef = null;
  }

  bindGame(game) { this.gameRef = game; }

  renderShop() {
    const query = (this.searchEl.value || '').toLowerCase();
    this.shopEl.innerHTML = '';
    this.shopCards.clear();
    const frag = document.createDocumentFragment();
    for (const def of TOWER_DEFS) {
      if (query && !def.name.toLowerCase().includes(query) && !def.archetype.includes(query)) continue;
      const card = document.createElement('div');
      card.className = 'tower-card';
      card.dataset.defId = def.id;
      card.innerHTML = `
        <div class="tower-swatch" style="background:${def.color};border:2px solid ${def.stroke}">${def.icon}</div>
        <div class="tower-name">${def.name}</div>
        <div class="tower-price">$${def.cost}</div>
      `;
      card.addEventListener('click', () => {
        if (!this.gameRef) return;
        if (this.gameRef.money < def.cost) return;
        this.gameRef.selectShopTower(def.id);
      });
      card.addEventListener('mouseenter', (e) => this.showShopTooltip(def, card));
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
      const def = getTowerDef(id);
      el.classList.toggle('unaffordable', money < def.cost);
    }
  }

  showShopTooltip(def, card) {
    const r = card.getBoundingClientRect();
    const host = this.tooltip.parentElement.getBoundingClientRect();
    const parts = [];
    parts.push(`<b>${def.name}</b>`);
    parts.push(`<span style="color:#a8b2c7">${def.archetype.toUpperCase()}</span>`);
    parts.push(`Cost: <b style="color:#ffb703">$${def.cost}</b>`);
    parts.push(`Damage: <b>${def.damage}</b>`);
    parts.push(`Range: <b>${(def.range / TILE_SIZE).toFixed(1)}</b> tiles`);
    parts.push(`Fire rate: <b>${(1000 / def.cooldown).toFixed(2)}</b>/s`);
    if (def.splash) parts.push(`Splash: <b>${(def.splash / TILE_SIZE).toFixed(1)}</b> tiles`);
    if (def.slow) parts.push(`Slow: <b>${Math.round((1 - def.slow) * 100)}%</b> for ${(def.slowDur/1000).toFixed(1)}s`);
    if (def.poisonDps) parts.push(`Poison: <b>${def.poisonDps}</b> dps for ${(def.poisonDur/1000).toFixed(1)}s`);
    if (def.chains) parts.push(`Chains: <b>${def.chains}</b> targets`);
    this.tooltip.innerHTML = parts.join('<br>');
    this.tooltip.style.left = `${r.left - host.left - 230}px`;
    this.tooltip.style.top = `${r.top - host.top}px`;
    this.tooltip.classList.add('show');
  }

  hideTooltip() { this.tooltip.classList.remove('show'); }

  showSelectedTowerPanel(t) {
    this.selPanel.classList.remove('hidden');
    this.selName.textContent = `${t.def.name} — Lv ${t.level}`;
    const upgCost = t.upgradeCost();
    const rows = [];
    rows.push(row('Archetype', t.def.archetype));
    rows.push(row('Damage', t.damage.toFixed(1)));
    rows.push(row('Range', (t.range / TILE_SIZE).toFixed(1) + ' tiles'));
    rows.push(row('Fire rate', (1000 / t.cooldown).toFixed(2) + '/s'));
    if (t.def.splash) rows.push(row('Splash', (t.splash / TILE_SIZE).toFixed(1) + ' tiles'));
    if (t.def.slow) rows.push(row('Slow', Math.round((1 - t.def.slow) * 100) + '%'));
    if (t.def.poisonDps) rows.push(row('Poison dps', t.poisonDps.toFixed(1)));
    if (t.def.chains) rows.push(row('Chains', t.def.chains));
    rows.push(row('Kills', t.killCount));
    rows.push(row('Upgrade', t.level >= 3 ? 'MAX' : '$' + upgCost));
    rows.push(row('Sell value', '$' + t.sellValue()));
    this.selStats.innerHTML = rows.join('');
    this.upgradeBtn.disabled = t.level >= 3;
    this.upgradeBtn.textContent = t.level >= 3 ? 'Max Level' : `Upgrade ($${upgCost})`;
    this.sellBtn.textContent = `Sell ($${t.sellValue()})`;
  }

  hideSelectedTowerPanel() { this.selPanel.classList.add('hidden'); }

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

  showGameOver(wave, victory) {
    document.getElementById('gameover-title').textContent = victory ? 'Victory!' : 'Defeat!';
    document.getElementById('gameover-wave').textContent = wave;
    showScreen('gameover-screen');
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
