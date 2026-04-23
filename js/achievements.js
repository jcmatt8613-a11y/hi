// Achievements. Tracked during a run; persisted via localStorage.
const STORAGE_KEY = 'towerRush:achievements';

export const ACHIEVEMENTS = [
  { id: 'first_blood',     name: 'First Blood',     description: 'Defeat your first enemy.',          check: s => s.kills >= 1 },
  { id: 'wave_10',         name: 'Boss Buster',     description: 'Defeat the first boss (wave 10).', check: s => s.bossKills >= 1 },
  { id: 'wave_20',         name: 'Veteran',         description: 'Reach wave 20.',                   check: s => s.wavesReached >= 20 },
  { id: 'wave_30',         name: 'Legend',          description: 'Reach wave 30.',                   check: s => s.wavesReached >= 30 },
  { id: 'wave_50',         name: 'Mythic',          description: 'Reach wave 50 (endless mode).',    check: s => s.wavesReached >= 50 },
  { id: 'collector_10',    name: 'Tower Collector', description: 'Place 10 different towers.',      check: s => s.uniqueTowers >= 10 },
  { id: 'collector_30',    name: 'Grand Collector', description: 'Place 30 different towers.',      check: s => s.uniqueTowers >= 30 },
  { id: 'paragon',         name: 'Paragon',         description: 'Upgrade a tower to level 5.',      check: s => s.maxTowerLevel >= 5 },
  { id: 'rich',            name: 'Rich',            description: 'Have $5,000 at once.',             check: s => s.peakMoney >= 5000 },
  { id: 'untouched',       name: 'Untouched',       description: 'Complete 5 waves without a leak.', check: s => s.cleanWaves >= 5 },
  { id: 'flawless_10',     name: 'Flawless',        description: 'Reach wave 10 with full 100 HP.',  check: s => s.wavesReached >= 10 && s.minHealth >= 100 },
  { id: 'pyromaniac',      name: 'Pyromaniac',      description: 'Kill 100 enemies with flame towers.', check: s => (s.killsByArchetype?.flame || 0) >= 100 },
  { id: 'sniper_elite',    name: 'Sniper Elite',    description: 'Get 50 kills with snipers.',       check: s => (s.killsByArchetype?.sniper || 0) >= 50 },
  { id: 'abuser',          name: 'Ability Abuser',  description: 'Use 5 abilities in a single run.', check: s => s.abilitiesUsed >= 5 },
  { id: 'conqueror',       name: 'Conqueror',       description: 'Beat every map on Normal.',        check: s => s.mapsWon.length >= 4 },
  { id: 'hero_10',         name: 'Heroic',          description: 'Level your hero to 10.',           check: s => s.heroMaxLevel >= 10 },
];

export class AchievementManager {
  constructor() {
    this.unlocked = new Set();
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) this.unlocked = new Set(ids);
      }
    } catch { /* ignore */ }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.unlocked]));
    } catch { /* ignore */ }
  }

  check(stats) {
    const newly = [];
    for (const a of ACHIEVEMENTS) {
      if (this.unlocked.has(a.id)) continue;
      try {
        if (a.check(stats)) {
          this.unlocked.add(a.id);
          newly.push(a);
        }
      } catch { /* ignore */ }
    }
    if (newly.length) this.save();
    return newly;
  }

  reset() {
    this.unlocked.clear();
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
}
