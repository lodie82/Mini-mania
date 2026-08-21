/* =========================================================
   MINI MANIA — game.js
   Moteur principal : navigation, pièces, sauvegarde, PWA
   ========================================================= */

const Store = {
  KEY: 'minimania_save_v1',
  data: null,
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this.data = raw ? JSON.parse(raw) : this.defaults();
    } catch (e) {
      this.data = this.defaults();
    }
    // merge missing keys (upgrade-safe)
    const d = this.defaults();
    for (const k in d) if (!(k in this.data)) this.data[k] = d[k];
    for (const g in d.best) if (!(g in this.data.best)) this.data.best[g] = 0;
    return this.data;
  },
  defaults() {
    return {
      coins: 0,
      soundOn: true,
      vibrateOn: true,
      best: { numbers: 0, colorblocks: 0, whois: 0, fruitmerge: 0, escape: 0, marblerace: 0 }
    };
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) {}
  },
  addCoins(n) {
    this.data.coins = Math.max(0, this.data.coins + n);
    this.save();
    App.refreshCoins();
  },
  setBest(game, score) {
    if (score > (this.data.best[game] || 0)) {
      this.data.best[game] = score;
      this.save();
      return true;
    }
    return false;
  }
};

const GAME_TITLES = {
  numbers: 'Nombres Correspondants',
  colorblocks: 'Color Blocks',
  whois: 'Qui est-ce ?',
  fruitmerge: 'Fusion de Fruits',
  escape: 'Escape',
  marblerace: 'Course de Billes'
};

const App = {
  currentGame: null,
  currentScore: 0,
  deferredPrompt: null,

  init() {
    Store.load();
    this.refreshCoins();
    this.bindNav();
    this.bindSettings();
    this.bindInstall();
    this.registerSW();
  },

  refreshCoins() {
    document.getElementById('coin-amount').textContent = Store.data.coins;
  },

  bindNav() {
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => this.openGame(card.dataset.game));
    });
    document.getElementById('btn-back').addEventListener('click', () => this.closeGame());
    document.getElementById('btn-menu').addEventListener('click', () => {
      this.hideOverlay('end-overlay');
      this.closeGame();
    });
    document.getElementById('btn-replay').addEventListener('click', () => {
      this.hideOverlay('end-overlay');
      this.openGame(this.currentGame, true);
    });
  },

  bindSettings() {
    const settingsOverlay = document.getElementById('settings-overlay');
    document.getElementById('btn-settings').addEventListener('click', () => {
      document.getElementById('toggle-sound').checked = Store.data.soundOn;
      document.getElementById('toggle-vibrate').checked = Store.data.vibrateOn;
      settingsOverlay.classList.remove('hidden');
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => settingsOverlay.classList.add('hidden'));
    document.getElementById('toggle-sound').addEventListener('change', e => { Store.data.soundOn = e.target.checked; Store.save(); });
    document.getElementById('toggle-vibrate').addEventListener('change', e => { Store.data.vibrateOn = e.target.checked; Store.save(); });
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('Effacer toute la progression (scores, pièces) ?')) {
        localStorage.removeItem(Store.KEY);
        Store.load();
        this.refreshCoins();
        settingsOverlay.classList.add('hidden');
      }
    });

    const noAdsOverlay = document.getElementById('noads-overlay');
    document.getElementById('btn-noads').addEventListener('click', () => noAdsOverlay.classList.remove('hidden'));
    document.getElementById('btn-close-noads').addEventListener('click', () => noAdsOverlay.classList.add('hidden'));
  },

  hideOverlay(id) { document.getElementById(id).classList.add('hidden'); },

  openGame(id, isReplay) {
    const mod = window.Games[id];
    if (!mod) return;
    this.currentGame = id;
    this.currentScore = 0;
    document.getElementById('game-title').textContent = GAME_TITLES[id] || mod.title || 'Jeu';
    document.getElementById('game-score-val').textContent = '0';
    const container = document.getElementById('game-container');
    container.innerHTML = '';

    document.getElementById('screen-home').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');

    const api = {
      onScore: (score) => {
        this.currentScore = score;
        document.getElementById('game-score-val').textContent = String(score);
      },
      onEnd: (result) => this.endGame(id, result),
      vibrate: (ms) => { if (Store.data.vibrateOn && navigator.vibrate) navigator.vibrate(ms || 20); },
      soundOn: () => Store.data.soundOn,
      bestScore: () => Store.data.best[id] || 0
    };

    mod.init(container, api);
  },

  closeGame() {
    const mod = window.Games[this.currentGame];
    if (mod && mod.destroy) mod.destroy();
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-home').classList.add('active');
    this.currentGame = null;
  },

  endGame(id, result) {
    const mod = window.Games[id];
    if (mod && mod.destroy) mod.destroy();

    const score = result.score || 0;
    const won = !!result.win;
    const coinsEarned = Math.max(1, Math.round(score / 5)) + (won ? 10 : 0);
    Store.addCoins(coinsEarned);
    const isNewBest = Store.setBest(id, score);

    document.getElementById('end-title').textContent = won ? '🎉 Victoire !' : 'Partie terminée';
    document.getElementById('end-message').textContent = result.message ||
      (won ? 'Bien joué, tu as réussi ce niveau !' : 'Pas mal ! Essaie encore pour faire mieux.');
    document.getElementById('end-score').textContent = score + (isNewBest ? ' 🏆 Nouveau record !' : '');
    document.getElementById('end-best').textContent = Store.data.best[id];
    document.getElementById('end-coins').textContent = '+' + coinsEarned;

    document.getElementById('end-overlay').classList.remove('hidden');
  },

  bindInstall() {
    const btn = document.getElementById('install-btn');
    const hint = document.getElementById('install-hint');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      btn.classList.remove('hidden');
    });

    btn.addEventListener('click', async () => {
      if (!this.deferredPrompt) { hint.classList.remove('hidden'); return; }
      this.deferredPrompt.prompt();
      await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      btn.classList.add('hidden');
    });

    window.addEventListener('appinstalled', () => {
      btn.classList.add('hidden');
      hint.classList.add('hidden');
    });

    // If not installed and prompt never fires after a delay, show manual hint
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone) {
      setTimeout(() => {
        if (!this.deferredPrompt) hint.classList.remove('hidden');
      }, 3500);
    }
  },

  registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => {});
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
