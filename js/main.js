// Entry point. Boots the game, wires menu screens, setup, and in-game controls.
import { Game } from './game.js';
import { UI, showScreen } from './ui.js';
import { sfx, setMuted, isMuted } from './sound.js';
import { MAPS } from './maps.js';
import { DIFFICULTIES } from './highscores.js';
import { HEROES } from './hero.js';

const ui = new UI();
const canvas = document.getElementById('game-canvas');
const game = new Game(canvas, ui);
ui.bindGame(game);

// --- Menu wiring ---
document.getElementById('btn-start').addEventListener('click', () => openSetup());
document.getElementById('btn-how').addEventListener('click', () => showScreen('how-screen'));
document.getElementById('btn-credits').addEventListener('click', () => showScreen('credits-screen'));
document.getElementById('btn-achievements').addEventListener('click', () => {
  ui.renderAchievements(document.getElementById('achievements-list'), game.achievements);
  showScreen('achievements-screen');
});
document.getElementById('btn-highscores').addEventListener('click', () => {
  ui.renderHighscores(document.getElementById('highscores-list'), game.highscores);
  showScreen('highscores-screen');
});
document.getElementById('btn-reset-ach').addEventListener('click', () => {
  if (confirm('Reset all achievements?')) {
    game.achievements.reset();
    ui.renderAchievements(document.getElementById('achievements-list'), game.achievements);
  }
});
document.getElementById('btn-reset-hs').addEventListener('click', () => {
  if (confirm('Clear all high scores?')) {
    game.highscores.reset();
    ui.renderHighscores(document.getElementById('highscores-list'), game.highscores);
  }
});

for (const btn of document.querySelectorAll('.back-btn')) {
  btn.addEventListener('click', () => showScreen(btn.dataset.back));
}

function openSetup() {
  ui.renderMapPicker(document.getElementById('map-picker'), game, (id) => { game.mapId = id; openSetup(); });
  ui.renderDifficultyPicker(document.getElementById('difficulty-picker'), game, (id) => { game.difficultyId = id; openSetup(); });
  ui.renderHeroPicker(document.getElementById('hero-picker'), game, (id) => { game.heroId = id; openSetup(); });
  document.getElementById('chk-endless').checked = game.endless;
  showScreen('setup-screen');
}

document.getElementById('chk-endless').addEventListener('change', (e) => { game.endless = e.target.checked; });
document.getElementById('btn-play').addEventListener('click', () => {
  startRun();
});

document.getElementById('btn-restart').addEventListener('click', () => startRun());
document.getElementById('btn-menu').addEventListener('click', () => {
  if (confirm('Return to main menu? Current run will end.')) {
    game.gameOver = true;
    game.stop();
    showScreen('menu-screen');
  }
});

function startRun() {
  game.stop();
  game.reset();
  ui.renderCategories();
  ui.renderShop();
  ui.updateStats(game);
  ui.updateSpeedButtons(1);
  ui.updatePauseButton(false);
  ui.renderWavePreview(1);
  ui.updateAbilityBar(game.abilityState, game.money);
  showScreen('game-screen');
  game.start();
}

// --- In-game controls ---
document.getElementById('btn-speed-1').addEventListener('click', () => game.setSpeed(1));
document.getElementById('btn-speed-2').addEventListener('click', () => game.setSpeed(2));
document.getElementById('btn-speed-3').addEventListener('click', () => game.setSpeed(4));
document.getElementById('btn-pause').addEventListener('click', () => game.togglePause());
document.getElementById('btn-mute').addEventListener('click', () => {
  setMuted(!isMuted());
  ui.updateMuteButton(isMuted());
});
document.getElementById('btn-upgrade').addEventListener('click', () => game.upgradeSelected());
document.getElementById('btn-sell').addEventListener('click', () => game.sellSelected());
document.getElementById('btn-target').addEventListener('click', () => game.cycleTargetMode());
document.getElementById('btn-hero-ability').addEventListener('click', () => game.useHeroAbility());

document.getElementById('tower-search').addEventListener('input', () => ui.renderShop());

ui.renderCategories();
ui.renderShop();
ui.updateStats(game);
ui.updateAbilityBar(game.abilityState, game.money);
