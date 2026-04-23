// Tower definitions (50 unique towers) and Tower class.
import { tileCenter, TILE_SIZE } from './grid.js';

// Archetype = firing behavior.
// Each tower has: id, name, archetype, cost, damage, range (px), cooldown (ms),
// color, stroke, icon, plus archetype-specific fields.
// Ranges in tiles (converted to px at runtime). 1 tile = 30px.

function T(tile) { return tile * TILE_SIZE; }

export const TOWER_DEFS = [
  // --- ARROW / BASIC (8) ---
  { id: 'arrow_1',  name: 'Scout Post',      archetype: 'basic', cost: 50,   damage: 6,   range: T(3),   cooldown: 800,  color: '#ffd166', stroke: '#b8860b', icon: 'A' },
  { id: 'arrow_2',  name: 'Archer Tower',    archetype: 'basic', cost: 110,  damage: 12,  range: T(3.5), cooldown: 720,  color: '#fcbf49', stroke: '#8a4b00', icon: 'A' },
  { id: 'arrow_3',  name: 'Crossbow Nest',   archetype: 'basic', cost: 200,  damage: 22,  range: T(4),   cooldown: 680,  color: '#f77f00', stroke: '#7c3a00', icon: 'A' },
  { id: 'arrow_4',  name: 'Longbow Keep',    archetype: 'basic', cost: 340,  damage: 38,  range: T(4.5), cooldown: 650,  color: '#e85d04', stroke: '#6a1a00', icon: 'A' },
  { id: 'arrow_5',  name: 'Ballista',        archetype: 'basic', cost: 520,  damage: 60,  range: T(5),   cooldown: 620,  color: '#dc2f02', stroke: '#590404', icon: 'A' },
  { id: 'arrow_6',  name: 'Royal Ranger',    archetype: 'basic', cost: 780,  damage: 92,  range: T(5.5), cooldown: 580,  color: '#9d0208', stroke: '#370617', icon: 'A' },
  { id: 'arrow_7',  name: 'Storm Archer',    archetype: 'basic', cost: 1150, damage: 140, range: T(6),   cooldown: 540,  color: '#6a040f', stroke: '#250505', icon: 'A' },
  { id: 'arrow_8',  name: 'Arcane Marksman', archetype: 'basic', cost: 1650, damage: 210, range: T(6.5), cooldown: 500,  color: '#3f0d12', stroke: '#0d0304', icon: 'A' },

  // --- RAPID / GATLING (6) ---
  { id: 'rapid_1', name: 'Pea Shooter',   archetype: 'rapid', cost: 90,   damage: 3,   range: T(3),   cooldown: 180, color: '#b7e4c7', stroke: '#1b4332', icon: 'R' },
  { id: 'rapid_2', name: 'Gatling',       archetype: 'rapid', cost: 180,  damage: 5,   range: T(3.2), cooldown: 150, color: '#74c69d', stroke: '#081c15', icon: 'R' },
  { id: 'rapid_3', name: 'Heavy Gatling', archetype: 'rapid', cost: 340,  damage: 9,   range: T(3.5), cooldown: 130, color: '#40916c', stroke: '#1b4332', icon: 'R' },
  { id: 'rapid_4', name: 'Minigun',       archetype: 'rapid', cost: 560,  damage: 14,  range: T(3.8), cooldown: 110, color: '#2d6a4f', stroke: '#081c15', icon: 'R' },
  { id: 'rapid_5', name: 'Auto-Cannon',   archetype: 'rapid', cost: 880,  damage: 22,  range: T(4.2), cooldown: 95,  color: '#1b4332', stroke: '#000', icon: 'R' },
  { id: 'rapid_6', name: 'Ion Repeater',  archetype: 'rapid', cost: 1300, damage: 32,  range: T(4.5), cooldown: 80,  color: '#0d3b2e', stroke: '#000', icon: 'R' },

  // --- SNIPER (6) ---
  { id: 'sniper_1', name: 'Watchtower',    archetype: 'sniper', cost: 220,  damage: 55,   range: T(7),    cooldown: 1800, color: '#a0c4ff', stroke: '#1d3557', icon: 'S' },
  { id: 'sniper_2', name: 'Sharpshooter',  archetype: 'sniper', cost: 420,  damage: 110,  range: T(8),    cooldown: 1700, color: '#82b4ff', stroke: '#1d3557', icon: 'S' },
  { id: 'sniper_3', name: 'Deadeye Nest',  archetype: 'sniper', cost: 720,  damage: 200,  range: T(9),    cooldown: 1600, color: '#5a9bff', stroke: '#1d3557', icon: 'S' },
  { id: 'sniper_4', name: 'Railgun',       archetype: 'sniper', cost: 1180, damage: 360,  range: T(10),   cooldown: 1500, color: '#3b82f6', stroke: '#0b1f3f', icon: 'S' },
  { id: 'sniper_5', name: 'Orbital Strike',archetype: 'sniper', cost: 1750, damage: 620,  range: T(11),   cooldown: 1400, color: '#2563eb', stroke: '#0b1f3f', icon: 'S' },
  { id: 'sniper_6', name: 'Void Piercer',  archetype: 'sniper', cost: 2600, damage: 1050, range: T(14),   cooldown: 1300, color: '#1e3a8a', stroke: '#000',    icon: 'S' },

  // --- CANNON / SPLASH (6) ---
  { id: 'cannon_1', name: 'Bomb Lobber',   archetype: 'cannon', cost: 200,  damage: 30,   range: T(3.5), cooldown: 1400, color: '#fca311', stroke: '#6a040f', icon: 'C', splash: T(1.3) },
  { id: 'cannon_2', name: 'Mortar',        archetype: 'cannon', cost: 380,  damage: 60,   range: T(4.5), cooldown: 1500, color: '#e76f51', stroke: '#6a040f', icon: 'C', splash: T(1.5) },
  { id: 'cannon_3', name: 'Howitzer',      archetype: 'cannon', cost: 680,  damage: 120,  range: T(5),   cooldown: 1600, color: '#e63946', stroke: '#450a0a', icon: 'C', splash: T(1.7) },
  { id: 'cannon_4', name: 'Siege Cannon',  archetype: 'cannon', cost: 1080, damage: 220,  range: T(5.5), cooldown: 1700, color: '#b5179e', stroke: '#3a0ca3', icon: 'C', splash: T(2.0) },
  { id: 'cannon_5', name: 'Meteor Caller', archetype: 'cannon', cost: 1600, damage: 380,  range: T(6.5), cooldown: 1800, color: '#7209b7', stroke: '#240046', icon: 'C', splash: T(2.2) },
  { id: 'cannon_6', name: 'Doomsday',      archetype: 'cannon', cost: 2300, damage: 640,  range: T(7.5), cooldown: 2000, color: '#3a0ca3', stroke: '#000',    icon: 'C', splash: T(2.6) },

  // --- FROST / SLOW (6) ---
  { id: 'frost_1', name: 'Icicle Spire',   archetype: 'frost', cost: 160,  damage: 4,   range: T(3),   cooldown: 700,  color: '#caf0f8', stroke: '#023e8a', icon: 'F', slow: 0.8, slowDur: 1500 },
  { id: 'frost_2', name: 'Frost Pylon',    archetype: 'frost', cost: 320,  damage: 8,   range: T(3.3), cooldown: 680,  color: '#90e0ef', stroke: '#023e8a', icon: 'F', slow: 0.7, slowDur: 1700 },
  { id: 'frost_3', name: 'Glacier Mage',   archetype: 'frost', cost: 580,  damage: 16,  range: T(3.6), cooldown: 650,  color: '#48cae4', stroke: '#03045e', icon: 'F', slow: 0.6, slowDur: 1900 },
  { id: 'frost_4', name: 'Blizzard Tower', archetype: 'frost', cost: 920,  damage: 28,  range: T(4),   cooldown: 620,  color: '#00b4d8', stroke: '#03045e', icon: 'F', slow: 0.5, slowDur: 2100 },
  { id: 'frost_5', name: 'Absolute Zero',  archetype: 'frost', cost: 1400, damage: 48,  range: T(4.5), cooldown: 580,  color: '#0096c7', stroke: '#03045e', icon: 'F', slow: 0.4, slowDur: 2300 },
  { id: 'frost_6', name: 'Cryo Singularity', archetype: 'frost', cost: 2050, damage: 78, range: T(5), cooldown: 550, color: '#0077b6', stroke: '#000',    icon: 'F', slow: 0.3, slowDur: 2500 },

  // --- POISON / DoT (6) ---
  { id: 'poison_1', name: 'Toxic Sprout',  archetype: 'poison', cost: 140,  damage: 3,  range: T(3),   cooldown: 900,  color: '#d9ed92', stroke: '#1a4314', icon: 'P', poisonDps: 6,   poisonDur: 2500 },
  { id: 'poison_2', name: 'Venom Shrine',  archetype: 'poison', cost: 280,  damage: 6,  range: T(3.2), cooldown: 850,  color: '#b5e48c', stroke: '#1a4314', icon: 'P', poisonDps: 12,  poisonDur: 2800 },
  { id: 'poison_3', name: 'Plague Totem',  archetype: 'poison', cost: 500,  damage: 10, range: T(3.5), cooldown: 800,  color: '#99d98c', stroke: '#1a4314', icon: 'P', poisonDps: 22,  poisonDur: 3000 },
  { id: 'poison_4', name: 'Acid Fountain', archetype: 'poison', cost: 820,  damage: 16, range: T(3.8), cooldown: 780,  color: '#76c893', stroke: '#0b2218', icon: 'P', poisonDps: 38,  poisonDur: 3200 },
  { id: 'poison_5', name: 'Biohazard',     archetype: 'poison', cost: 1250, damage: 26, range: T(4.2), cooldown: 760,  color: '#52b69a', stroke: '#0b2218', icon: 'P', poisonDps: 64,  poisonDur: 3500 },
  { id: 'poison_6', name: 'Corruption',    archetype: 'poison', cost: 1850, damage: 40, range: T(4.6), cooldown: 740,  color: '#34a0a4', stroke: '#000',    icon: 'P', poisonDps: 110, poisonDur: 3800 },

  // --- CHAIN LIGHTNING (6) ---
  { id: 'chain_1', name: 'Spark Coil',      archetype: 'chain', cost: 260,  damage: 10,  range: T(3.2), cooldown: 900,  color: '#fff3b0', stroke: '#6a4c93', icon: 'L', chains: 2, chainRange: T(2.5) },
  { id: 'chain_2', name: 'Tesla Coil',      archetype: 'chain', cost: 480,  damage: 20,  range: T(3.5), cooldown: 850,  color: '#ffdd00', stroke: '#6a4c93', icon: 'L', chains: 3, chainRange: T(2.8) },
  { id: 'chain_3', name: 'Storm Node',      archetype: 'chain', cost: 820,  damage: 38,  range: T(3.8), cooldown: 800,  color: '#f6bd60', stroke: '#3a0ca3', icon: 'L', chains: 4, chainRange: T(3.0) },
  { id: 'chain_4', name: 'Thunder Dynamo',  archetype: 'chain', cost: 1300, damage: 68,  range: T(4.2), cooldown: 780,  color: '#f7b801', stroke: '#3a0ca3', icon: 'L', chains: 5, chainRange: T(3.2) },
  { id: 'chain_5', name: 'Zeus Relay',      archetype: 'chain', cost: 1900, damage: 115, range: T(4.6), cooldown: 760,  color: '#ffb703', stroke: '#3a0ca3', icon: 'L', chains: 6, chainRange: T(3.5) },
  { id: 'chain_6', name: 'Celestial Storm', archetype: 'chain', cost: 2700, damage: 185, range: T(5),   cooldown: 740,  color: '#fb8500', stroke: '#000',    icon: 'L', chains: 8, chainRange: T(3.8) },

  // --- LASER / BEAM (6) ---
  { id: 'laser_1', name: 'Laser Pointer',    archetype: 'laser', cost: 300,  damage: 4,   range: T(3.5), cooldown: 80,  color: '#ffadad', stroke: '#9d0208', icon: 'B' },
  { id: 'laser_2', name: 'Pulse Laser',      archetype: 'laser', cost: 540,  damage: 8,   range: T(3.8), cooldown: 75,  color: '#ff7b7b', stroke: '#9d0208', icon: 'B' },
  { id: 'laser_3', name: 'Beam Cannon',      archetype: 'laser', cost: 900,  damage: 15,  range: T(4.2), cooldown: 70,  color: '#ef476f', stroke: '#6a040f', icon: 'B' },
  { id: 'laser_4', name: 'Photon Lance',     archetype: 'laser', cost: 1400, damage: 26,  range: T(4.6), cooldown: 65,  color: '#d00000', stroke: '#6a040f', icon: 'B' },
  { id: 'laser_5', name: 'Plasma Reactor',   archetype: 'laser', cost: 2000, damage: 44,  range: T(5),   cooldown: 60,  color: '#9d0208', stroke: '#370617', icon: 'B' },
  { id: 'laser_6', name: 'Singularity Beam', archetype: 'laser', cost: 2900, damage: 72,  range: T(5.5), cooldown: 55,  color: '#6a040f', stroke: '#000',    icon: 'B' },
];

export function getTowerDef(id) {
  return TOWER_DEFS.find(t => t.id === id);
}

export class Tower {
  constructor(defId, c, r) {
    const def = getTowerDef(defId);
    this.defId = defId;
    this.def = def;
    this.c = c; this.r = r;
    const center = tileCenter(c, r);
    this.x = center.x; this.y = center.y;
    this.level = 1; // 1..3
    this.lastShot = 0;
    this.totalInvested = def.cost;
    this.angle = 0; // facing angle (radians)
    this.targetMode = 'first'; // future: cycle
    this.killCount = 0;
    this.dmgDealt = 0;
    // Transient beam state (laser)
    this.beamUntil = 0;
    this.beamTarget = null;
  }

  // Stat multipliers by level.
  statMult() {
    const lvl = this.level;
    // Level 1 = 1x, Level 2 = 1.6x damage, 1.15x range, 0.85x cooldown
    // Level 3 = 2.4x damage, 1.3x range, 0.7x cooldown
    if (lvl === 2) return { dmg: 1.6, range: 1.15, cd: 0.85 };
    if (lvl === 3) return { dmg: 2.4, range: 1.3,  cd: 0.7 };
    return { dmg: 1, range: 1, cd: 1 };
  }

  get damage() { return this.def.damage * this.statMult().dmg; }
  get range()  { return this.def.range  * this.statMult().range; }
  get cooldown() { return this.def.cooldown * this.statMult().cd; }
  get splash() { return (this.def.splash || 0) * this.statMult().range; }
  get poisonDps() { return (this.def.poisonDps || 0) * this.statMult().dmg; }
  get poisonDur() { return this.def.poisonDur || 0; }
  get slow() { return this.def.slow || 1; }
  get slowDur() { return this.def.slowDur || 0; }
  get chains() { return this.def.chains || 0; }
  get chainRange() { return this.def.chainRange || 0; }

  upgradeCost() {
    if (this.level >= 3) return Infinity;
    return Math.round(this.def.cost * (this.level === 1 ? 0.9 : 1.6));
  }

  sellValue() {
    return Math.floor(this.totalInvested * 0.7);
  }

  tryUpgrade() {
    if (this.level >= 3) return false;
    this.totalInvested += this.upgradeCost();
    this.level += 1;
    return true;
  }

  drawBase(ctx) {
    const s = 12;
    ctx.save();
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 10, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base
    ctx.fillStyle = this.def.color;
    ctx.strokeStyle = this.def.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Turret barrel (rotates toward target)
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.def.stroke;
    ctx.fillRect(0, -2, 14, 4);
    ctx.fillStyle = this.def.color;
    ctx.fillRect(0, -1, 12, 2);

    ctx.restore();

    // Icon letter
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.def.icon, this.x, this.y);
    ctx.restore();

    // Level pips
    for (let i = 0; i < this.level; i++) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(this.x - 8 + i * 8, this.y + 11, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
