// Bootstraps the game, menus, and global controls.
import { Game } from './game.js';
import { UI, showScreen } from './ui.js';
import { sfx, setMuted, isMuted, resumeAudio } from './sound.js';

const canvas = document.getElementById('game-canvas');
const ui = new UI();
const game = new Game(canvas, ui);
ui.bindGame(game);

// Menu navigation
document.getElementById('btn-start').addEventListener('click', () => {
  startNewGame();
});
document.getElementById('btn-how').addEventListener('click', () => showScreen('how-screen'));
document.getElementById('btn-credits').addEventListener('click', () => showScreen('credits-screen'));
document.getElementById('btn-restart').addEventListener('click', () => startNewGame());
for (const el of document.querySelectorAll('[data-back]')) {
  el.addEventListener('click', () => showScreen(el.dataset.back));
}

// Game controls
document.getElementById('btn-speed-1').addEventListener('click', () => game.setSpeed(1));
document.getElementById('btn-speed-2').addEventListener('click', () => game.setSpeed(2));
document.getElementById('btn-speed-3').addEventListener('click', () => game.setSpeed(4));
document.getElementById('btn-pause').addEventListener('click', () => game.togglePause());
document.getElementById('btn-mute').addEventListener('click', () => {
  setMuted(!isMuted());
  ui.updateMuteButton(isMuted());
});
document.getElementById('btn-menu').addEventListener('click', () => {
  game.stop();
  showScreen('menu-screen');
});
document.getElementById('btn-upgrade').addEventListener('click', () => game.upgradeSelected());
document.getElementById('btn-sell').addEventListener('click', () => game.sellSelected());
document.getElementById('tower-search').addEventListener('input', () => ui.renderShop());

function startNewGame() {
  resumeAudio();
  game.stop();
  game.reset();
  ui.renderShop();
  ui.updateStats(game);
  ui.updateSpeedButtons(1);
  ui.updatePauseButton(false);
  ui.hideSelectedTowerPanel();
  showScreen('game-screen');
  game.start();
}

// Initial render of shop in case user opens game directly
ui.renderShop();
