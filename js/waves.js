// Wave generation. Waves scale in HP, enemy count, and variety.
// Every 10th wave is a boss wave.

const BOSS_ORDER = ['boss_golem', 'boss_phantom', 'boss_dragon', 'boss_titan', 'boss_overlord'];

export function generateWave(waveNumber) {
  // Returns array of { type, delay } spawn entries.
  if (waveNumber % 10 === 0) return generateBossWave(waveNumber);

  const entries = [];
  const w = waveNumber;
  const baseCount = 6 + Math.floor(w * 1.2);

  // Composition pools unlocked by wave
  const pool = ['slime'];
  if (w >= 2) pool.push('runner');
  if (w >= 3) pool.push('grunt');
  if (w >= 5) pool.push('swarm');
  if (w >= 6) pool.push('tank');
  if (w >= 8) pool.push('ghost');
  if (w >= 12) pool.push('armored');
  if (w >= 14) pool.push('drone');
  if (w >= 18) pool.push('brute');

  const n = baseCount;
  for (let i = 0; i < n; i++) {
    const type = pool[Math.floor(Math.random() * pool.length)];
    // Base delay shortens as waves advance; swarm/drones come in bursts.
    let delay = Math.max(250, 700 - w * 12 + Math.random() * 200);
    if (type === 'swarm' || type === 'drone') delay *= 0.55;
    if (type === 'tank' || type === 'brute' || type === 'armored') delay *= 1.4;
    entries.push({ type, delay });
  }

  // Sprinkle mini-bursts
  if (w >= 4 && w % 5 === 0) {
    const burst = 8 + w;
    for (let i = 0; i < burst; i++) entries.push({ type: 'swarm', delay: 180 });
  }

  return entries;
}

function generateBossWave(waveNumber) {
  const idx = Math.min(BOSS_ORDER.length - 1, Math.floor(waveNumber / 10) - 1);
  const boss = BOSS_ORDER[idx];
  const entries = [];
  // Minions before the boss
  const minionCount = 10 + Math.floor(waveNumber * 0.6);
  for (let i = 0; i < minionCount; i++) {
    entries.push({ type: Math.random() < 0.6 ? 'grunt' : 'tank', delay: 400 });
  }
  entries.push({ type: boss, delay: 1200, isBoss: true });
  // Bodyguards after the boss
  const guards = 6 + Math.floor(waveNumber * 0.4);
  for (let i = 0; i < guards; i++) {
    entries.push({ type: Math.random() < 0.5 ? 'armored' : 'brute', delay: 500 });
  }
  return entries;
}

export function hpMultiplierForWave(w) {
  // Smooth exponential growth to keep late game challenging.
  return 1 + (w - 1) * 0.18 + Math.pow(Math.max(0, w - 10), 1.35) * 0.03;
}
