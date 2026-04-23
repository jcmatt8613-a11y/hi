// Hero unit: a placeable unit that levels up from kills and has an active ability.
import { tileCenter, TILE_SIZE } from './grid.js';

export const HEROES = [
  {
    id: 'knight',
    name: 'Sir Blazeheart',
    description: 'Balanced knight with a flaming slash. Range 3.5, splash damage.',
    color: '#f94144', stroke: '#6a040f', icon: '⚔',
    cost: 750,
    baseDamage: 30,
    range: TILE_SIZE * 3.5,
    cooldown: 700,
    splash: TILE_SIZE * 1.0,
    ability: { name: 'Whirlwind', cooldown: 20000, description: 'Damage all enemies in double range' },
  },
  {
    id: 'archer',
    name: 'Sylverin',
    description: 'Elven archer with enormous range and piercing shots.',
    color: '#52b788', stroke: '#1a4314', icon: '🏹',
    cost: 900,
    baseDamage: 55,
    range: TILE_SIZE * 6.5,
    cooldown: 900,
    pierce: true,
    ability: { name: 'Rain of Arrows', cooldown: 24000, description: 'Storm of arrows across map' },
  },
  {
    id: 'mage',
    name: 'Archmage Vex',
    description: 'Lightning mage that chains to multiple enemies.',
    color: '#7209b7', stroke: '#3a0ca3', icon: '🔮',
    cost: 1100,
    baseDamage: 45,
    range: TILE_SIZE * 5,
    cooldown: 1000,
    chains: 4,
    chainRange: TILE_SIZE * 2.5,
    ability: { name: 'Blizzard', cooldown: 28000, description: 'Slow + damage all enemies' },
  },
];

export function getHeroDef(id) { return HEROES.find(h => h.id === id); }

export class Hero {
  constructor(defId, c, r) {
    const def = getHeroDef(defId);
    this.defId = defId;
    this.def = def;
    this.c = c; this.r = r;
    const ct = tileCenter(c, r);
    this.x = ct.x; this.y = ct.y;
    this.xp = 0;
    this.level = 1; // 1..10
    this.lastShot = 0;
    this.lastAbility = -Infinity;
    this.angle = 0;
    this.killCount = 0;
  }

  xpForNextLevel() { return 80 + this.level * 120; }

  addXp(n) {
    this.xp += n;
    while (this.level < 10 && this.xp >= this.xpForNextLevel()) {
      this.xp -= this.xpForNextLevel();
      this.level += 1;
    }
  }

  get damage() { return this.def.baseDamage * (1 + 0.18 * (this.level - 1)); }
  get range() { return this.def.range * (1 + 0.03 * (this.level - 1)); }
  get cooldown() { return this.def.cooldown * Math.pow(0.97, this.level - 1); }

  canUseAbility(now) {
    return (now - this.lastAbility) >= this.def.ability.cooldown;
  }

  abilityCooldown(now) {
    return Math.max(0, this.def.ability.cooldown - (now - this.lastAbility));
  }

  draw(ctx) {
    ctx.save();
    // Aura ring
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x, this.y, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;

    // Body
    ctx.fillStyle = this.def.color;
    ctx.strokeStyle = this.def.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x, this.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Weapon
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.def.stroke;
    ctx.fillRect(0, -2, 16, 4);
    ctx.restore();

    // Icon
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.def.icon, this.x, this.y);

    // Level badge
    ctx.fillStyle = '#ffd60a';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(this.x + 10, this.y - 10, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#241b00';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(String(this.level), this.x + 10, this.y - 10);

    ctx.restore();
  }
}
