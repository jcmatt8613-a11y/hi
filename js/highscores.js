// Simple high-score storage keyed by (map, difficulty, mode).
const STORAGE_KEY = 'towerRush:scores';

export const DIFFICULTIES = [
  { id: 'easy',   name: 'Easy',   hpMult: 0.75, speedMult: 0.9, moneyMult: 1.2, startMoney: 750 },
  { id: 'normal', name: 'Normal', hpMult: 1.0,  speedMult: 1.0, moneyMult: 1.0, startMoney: 500 },
  { id: 'hard',   name: 'Hard',   hpMult: 1.4,  speedMult: 1.1, moneyMult: 0.9, startMoney: 400 },
  { id: 'insane', name: 'Insane', hpMult: 1.8,  speedMult: 1.2, moneyMult: 0.8, startMoney: 350 },
];

export function getDifficulty(id) { return DIFFICULTIES.find(d => d.id === id) || DIFFICULTIES[1]; }

export class Highscores {
  constructor() {
    this.records = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.records = JSON.parse(raw) || {};
    } catch { /* ignore */ }
  }

  _key(map, diff, mode) { return `${map}:${diff}:${mode}`; }

  best(map, diff, mode) {
    return this.records[this._key(map, diff, mode)] || null;
  }

  report(map, diff, mode, score, wave) {
    const k = this._key(map, diff, mode);
    const cur = this.records[k];
    if (!cur || score > cur.score) {
      this.records[k] = { score, wave, at: Date.now() };
      this.save();
      return true;
    }
    return false;
  }

  all() {
    return Object.entries(this.records).map(([k, v]) => {
      const [map, diff, mode] = k.split(':');
      return { map, diff, mode, ...v };
    }).sort((a, b) => b.score - a.score);
  }

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records)); } catch { /* ignore */ }
  }

  reset() {
    this.records = {};
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
}
