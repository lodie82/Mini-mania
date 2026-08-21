/* =========================================================
   MINI-JEU 3 : QUI EST-CE ?
   Trouve le personnage qui correspond à la description parmi
   plusieurs personnages générés (couleur, coiffure, accessoire).
   ========================================================= */
(function () {
  const COLORS = [
    { name: 'rose', hex: '#ff6b9d' }, { name: 'bleu', hex: '#4ea8ff' },
    { name: 'vert', hex: '#6bdc7c' }, { name: 'jaune', hex: '#ffd166' },
    { name: 'violet', hex: '#c084fc' }, { name: 'orange', hex: '#ff9f45' }
  ];
  const HAIR = [
    { name: 'noirs', hex: '#2b1d3e' }, { name: 'blonds', hex: '#ffd166' },
    { name: 'roux', hex: '#ff7a45' }, { name: 'bleus', hex: '#4ea8ff' }
  ];
  const ACCESSORY = ['lunettes', 'chapeau', 'noeud papillon', 'rien'];

  let root, api, round, lives, score, totalRounds, target, candidates;

  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(arr) { return arr[rand(arr.length)]; }

  function randomChar() {
    return { color: pick(COLORS), hair: pick(HAIR), accessory: pick(ACCESSORY) };
  }
  function sameChar(a, b) {
    return a.color.name === b.color.name && a.hair.name === b.hair.name && a.accessory === b.accessory;
  }

  function buildRound() {
    target = randomChar();
    candidates = [target];
    let guard = 0;
    while (candidates.length < 6 && guard < 200) {
      guard++;
      const c = randomChar();
      if (candidates.some(x => sameChar(x, c))) continue;
      candidates.push(c);
    }
    // shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
  }

  function accessoryHtml(acc, hairHex) {
    if (acc === 'lunettes') return `<div class="wi-glasses"></div>`;
    if (acc === 'chapeau') return `<div class="wi-hat" style="border-bottom-color:${hairHex}"></div>`;
    if (acc === 'noeud papillon') return `<div class="wi-bowtie"></div>`;
    return '';
  }

  function avatarHtml(ch) {
    return `
      <div class="wi-avatar">
        ${accessoryHtml(ch.accessory, ch.hair.hex)}
        <div class="wi-face" style="background:${ch.color.hex}">
          <div class="wi-hairtop" style="background:${ch.hair.hex}"></div>
          <div class="wi-eyes"><span></span><span></span></div>
          <div class="wi-mouth"></div>
        </div>
      </div>`;
  }

  function describe(ch) {
    let parts = [`la peau <b>${ch.color.name}</b>`, `les cheveux <b>${ch.hair.name}</b>`];
    if (ch.accessory !== 'rien') parts.push(`et porte <b>${ch.accessory === 'noeud papillon' ? 'un noeud papillon' : 'un ' + ch.accessory}</b>`);
    else parts.push(`sans accessoire`);
    return `Trouve le personnage qui a ${parts.join(', ')}.`;
  }

  function render() {
    root.querySelector('#wi-desc').innerHTML = describe(target);
    root.querySelector('#wi-progress').textContent = `Manche ${round}/${totalRounds}`;
    root.querySelector('#wi-lives').textContent = '❤️'.repeat(lives);
    const grid = root.querySelector('#wi-grid');
    grid.innerHTML = '';
    candidates.forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'wi-card';
      btn.innerHTML = avatarHtml(ch);
      btn.addEventListener('click', () => onPick(ch, btn));
      grid.appendChild(btn);
    });
  }

  function onPick(ch, btn) {
    if (sameChar(ch, target)) {
      btn.classList.add('wi-correct');
      score += 15;
      api.onScore(score);
      api.vibrate(15);
      setTimeout(nextRound, 500);
    } else {
      btn.classList.add('wi-wrong');
      api.vibrate(40);
      lives--;
      root.querySelector('#wi-lives').textContent = '❤️'.repeat(Math.max(0, lives));
      if (lives <= 0) {
        setTimeout(() => api.onEnd({ win: false, score, message: 'Plus de vies ! Réessaie.' }), 500);
      }
    }
  }

  function nextRound() {
    round++;
    if (round > totalRounds) {
      api.onEnd({ win: true, score, message: 'Tu as tout deviné ! Quel oeil de lynx !' });
      return;
    }
    buildRound();
    render();
  }

  function init(container, gameApi) {
    api = gameApi; root = container;
    round = 1; lives = 3; score = 0; totalRounds = 8;
    buildRound();

    root.innerHTML = `
      <div class="wi-wrap">
        <div class="wi-top">
          <span id="wi-progress"></span>
          <span id="wi-lives"></span>
        </div>
        <p id="wi-desc" class="wi-desc"></p>
        <div id="wi-grid" class="wi-grid"></div>
      </div>`;
    render();
    api.onScore(score);
  }

  function destroy() {}

  const style = document.createElement('style');
  style.textContent = `
    .wi-wrap { width:100%; height:100%; overflow:auto; padding:16px; display:flex; flex-direction:column; align-items:center; }
    .wi-top { width:100%; max-width:380px; display:flex; justify-content:space-between; color:#fff; font-weight:800; margin-bottom:8px; }
    .wi-desc { color:#fff; text-align:center; max-width:340px; margin-bottom:14px; font-size:14px; line-height:1.4; }
    .wi-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; width:100%; max-width:380px; }
    .wi-card { background:#2e2050; border-radius:16px; padding:8px; box-shadow:0 4px 0 rgba(0,0,0,0.3); transition:transform .1s; }
    .wi-card:active { transform:scale(0.92); }
    .wi-card.wi-correct { background:#2fae66; }
    .wi-card.wi-wrong { background:#c93b3b; }
    .wi-avatar { position:relative; width:100%; aspect-ratio:1; display:flex; align-items:center; justify-content:center; }
    .wi-face { position:relative; width:78%; height:78%; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .wi-hairtop { position:absolute; top:-10%; left:10%; width:80%; height:45%; border-radius:50% 50% 0 0; }
    .wi-eyes { display:flex; gap:10px; margin-top:8px; }
    .wi-eyes span { width:6px; height:6px; background:#2b1d3e; border-radius:50%; display:block; }
    .wi-mouth { width:16px; height:8px; border-bottom:3px solid #2b1d3e; border-radius:0 0 10px 10px; margin-top:5px; }
    .wi-glasses { position:absolute; top:38%; width:60%; height:14%; border:3px solid #2b1d3e; border-radius:6px; z-index:2; background:rgba(255,255,255,0.15); }
    .wi-hat { position:absolute; top:-22%; width:0; height:0; border-left:22px solid transparent; border-right:22px solid transparent; border-bottom:26px solid; z-index:2; }
    .wi-bowtie { position:absolute; bottom:6%; width:22px; height:14px; z-index:2; background:#ff5d5d; clip-path: polygon(0 0,50% 35%,0 100%,100% 100%,50% 35%,100% 0); }
  `;
  document.head.appendChild(style);

  window.Games = window.Games || {};
  window.Games.whois = { title: 'Qui est-ce ?', init, destroy };
})();
