// Player-activated abilities with cooldowns. Triggered from the abilities bar.
// When an ability is "armed", the next canvas click targets it.
import { TILE_SIZE } from './grid.js';

export const ABILITIES = [
  {
    id: 'fireball',
    name: 'Fireball',
    icon: '🔥',
    description: 'Hurl a fireball that deals heavy damage and burns enemies in a large area.',
    cost: 75,
    cooldown: 14000,
    radius: TILE_SIZE * 2.2,
    damage: 250,
    burnDps: 60,
    burnDur: 3000,
    color: '#ff6b35',
    hotkey: 'q',
    requiresTarget: true,
  },
  {
    id: 'ice_nova',
    name: 'Ice Nova',
    icon: '❄️',
    description: 'Freeze all enemies on the map for 2 seconds and slow them for 4 more.',
    cost: 110,
    cooldown: 22000,
    damage: 60,
    slow: 0.35,
    slowDur: 4000,
    freezeDur: 2000,
    color: '#90e0ef',
    hotkey: 'w',
    requiresTarget: false,
  },
  {
    id: 'gold_rush',
    name: 'Gold Rush',
    icon: '💰',
    description: 'Instant cash injection of $300 + bonus per wave reached.',
    cost: 0,
    cooldown: 45000,
    color: '#ffd60a',
    hotkey: 'e',
    requiresTarget: false,
  },
  {
    id: 'lightning_storm',
    name: 'Lightning Storm',
    icon: '⚡',
    description: 'A storm strikes 10 random enemies with chain lightning.',
    cost: 150,
    cooldown: 30000,
    strikes: 10,
    damage: 180,
    stunDur: 600,
    color: '#ffd166',
    hotkey: 'r',
    requiresTarget: false,
  },
];

export class AbilityState {
  constructor() {
    this.lastUsed = {}; // id -> timestamp
    this.armed = null;  // id of ability awaiting target click
  }

  isReady(id, now) {
    const ab = ABILITIES.find(a => a.id === id);
    if (!ab) return false;
    return (now - (this.lastUsed[id] || -Infinity)) >= ab.cooldown;
  }

  cooldownRemaining(id, now) {
    const ab = ABILITIES.find(a => a.id === id);
    if (!ab) return 0;
    return Math.max(0, ab.cooldown - (now - (this.lastUsed[id] || -Infinity)));
  }

  arm(id) {
    this.armed = id;
  }

  markUsed(id, now) {
    this.lastUsed[id] = now;
    this.armed = null;
  }

  cancel() { this.armed = null; }
}
