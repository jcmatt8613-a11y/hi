// Wave generation with new enemy unlocks, flying waves, and bigger boss variety.
// Every 10th wave spawns a boss.

const BOSS_ORDER = [
  'boss_golem', 'boss_phantom', 'boss_dragon', 'boss_titan',
  'boss_overlord', 'boss_hydra', 'boss_lich', 'boss_avatar',
];

export function generateWave(waveNumber, opts = {}) {
  if (waveNumber % 10 === 0) return generateBossWave(waveNumber);

  const entries = [];
  const w = waveNumber;
  const baseCount = 6 + Math.floor(w * 1.2);

  const pool = ['slime'];
  if (w >= 2) pool.push('runner');
  if (w >= 3) pool.push('grunt');
  if (w >= 4) pool.push('bat');              // flying introduced early
  if (w >= 5) pool.push('swarm');
  if (w >= 6) pool.push('tank');
  if (w >= 7) pool.push('shielded');
  if (w >= 8) pool.push('ghost');
  if (w >= 9) pool.push('vulture');
  if (w >= 11) pool.push('regen');
  if (w >= 12) pool.push('armored');
  if (w >= 13) pool.push('splitter');
  if (w >= 14) pool.push('drone');
  if (w >= 15) pool.push('healer');
  if (w >= 17) pool.push('dragonkin');
  if (w >= 18) pool.push('brute');

  const n = baseCount;
  for (let i = 0; i < n; i++) {
    const type = pool[Math.floor(Math.random() * pool.length)];
    let delay = Math.max(250, 700 - w * 12 + Math.random() * 200);
    if (type === 'swarm' || type === 'drone' || type === 'bat') delay *= 0.55;
    if (type === 'tank' || type === 'brute' || type === 'armored') delay *= 1.4;
    if (type === 'dragonkin') delay *= 1.3;
    entries.push({ type, delay });
  }

  // Mini bursts every 5 waves
  if (w >= 4 && w % 5 === 0) {
    const burst = 8 + w;
    for (let i = 0; i < burst; i++) entries.push({ type: 'swarm', delay: 180 });
  }
  // Flying swarm interludes
  if (w >= 9 && w % 6 === 0) {
    const burst = 6 + Math.floor(w / 2);
    for (let i = 0; i < burst; i++) entries.push({ type: 'bat', delay: 220 });
  }

  return entries;
}

function generateBossWave(waveNumber) {
  const idx = Math.min(BOSS_ORDER.length - 1, Math.floor(waveNumber / 10) - 1);
  const boss = BOSS_ORDER[idx];
  const entries = [];
  const minionCount = 10 + Math.floor(waveNumber * 0.6);
  for (let i = 0; i < minionCount; i++) {
    const r = Math.random();
    const type = r < 0.5 ? 'grunt' : r < 0.85 ? 'tank' : 'bat';
    entries.push({ type, delay: 400 });
  }
  entries.push({ type: boss, delay: 1200, isBoss: true });
  const guards = 6 + Math.floor(waveNumber * 0.4);
  for (let i = 0; i < guards; i++) {
    const type = Math.random() < 0.5 ? 'armored' : 'brute';
    entries.push({ type, delay: 500 });
  }
  return entries;
}

export function hpMultiplierForWave(w) {
  return 1 + (w - 1) * 0.18 + Math.pow(Math.max(0, w - 10), 1.35) * 0.03;
}

// Wave preview: counts of each enemy type without spawning them.
export function previewWave(waveNumber) {
  const counts = {};
  for (const e of generateWave(waveNumber)) {
    counts[e.type] = (counts[e.type] || 0) + 1;
  }
  return counts;
}
