// Multiple maps. Each map defines grid size, path waypoints, and theme colors.
export const MAPS = [
  {
    id: 'meadow',
    name: 'Emerald Meadow',
    description: 'A gentle, winding path through green plains. Great for beginners.',
    difficultyMod: 1.0,
    theme: {
      grassA: '#2a9d8f', grassB: '#24867a',
      pathA: '#8d6748', pathB: '#6b4f35',
      pathInner: '#a4794f',
      sky: ['#1b3556', '#0a1323'],
      accent: '#06d6a0',
    },
    path: [
      { c: -1, r: 3 }, { c: 4, r: 3 }, { c: 4, r: 10 }, { c: 1, r: 10 },
      { c: 1, r: 17 }, { c: 8, r: 17 }, { c: 8, r: 6 }, { c: 13, r: 6 },
      { c: 13, r: 14 }, { c: 17, r: 14 }, { c: 17, r: 2 }, { c: 20, r: 2 },
    ],
  },
  {
    id: 'scorched',
    name: 'Scorched Canyon',
    description: 'Cracked earth and magma-lit cliffs. Enemies move faster in the heat.',
    difficultyMod: 1.2,
    enemySpeedMult: 1.1,
    theme: {
      grassA: '#8a3b1a', grassB: '#6e2e12',
      pathA: '#3a1f10', pathB: '#1e0f08',
      pathInner: '#b5582a',
      sky: ['#3a0d0a', '#120303'],
      accent: '#ffba08',
    },
    path: [
      { c: -1, r: 1 }, { c: 6, r: 1 }, { c: 6, r: 8 }, { c: 2, r: 8 },
      { c: 2, r: 14 }, { c: 10, r: 14 }, { c: 10, r: 4 }, { c: 15, r: 4 },
      { c: 15, r: 18 }, { c: 20, r: 18 },
    ],
  },
  {
    id: 'glacier',
    name: 'Glacier Pass',
    description: 'Icy tundra with frost-slowed enemies but tougher armored foes.',
    difficultyMod: 1.35,
    enemySpeedMult: 0.9,
    enemyHpMult: 1.25,
    theme: {
      grassA: '#bde0fe', grassB: '#a2d2ff',
      pathA: '#4a6b82', pathB: '#2b4560',
      pathInner: '#7ba8cc',
      sky: ['#1d3557', '#0e1a2b'],
      accent: '#90e0ef',
    },
    path: [
      { c: -1, r: 10 }, { c: 3, r: 10 }, { c: 3, r: 3 }, { c: 9, r: 3 },
      { c: 9, r: 15 }, { c: 14, r: 15 }, { c: 14, r: 6 }, { c: 18, r: 6 },
      { c: 18, r: 12 }, { c: 20, r: 12 },
    ],
  },
  {
    id: 'abyss',
    name: 'Void Abyss',
    description: 'A nightmare realm. Enemies are stronger and rewards are bigger.',
    difficultyMod: 1.6,
    enemyHpMult: 1.4,
    rewardMult: 1.25,
    theme: {
      grassA: '#22223b', grassB: '#2d2d55',
      pathA: '#6a0572', pathB: '#3a0062',
      pathInner: '#a4009b',
      sky: ['#240046', '#05011d'],
      accent: '#ff006e',
    },
    path: [
      { c: -1, r: 17 }, { c: 5, r: 17 }, { c: 5, r: 4 }, { c: 2, r: 4 },
      { c: 2, r: 10 }, { c: 11, r: 10 }, { c: 11, r: 2 }, { c: 16, r: 2 },
      { c: 16, r: 16 }, { c: 13, r: 16 }, { c: 13, r: 19 }, { c: 20, r: 19 },
    ],
  },
];

export function getMap(id) {
  return MAPS.find(m => m.id === id) || MAPS[0];
}
