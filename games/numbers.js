/* =========================================================
   MINI-JEU 1 : NOMBRES CORRESPONDANTS
   Trouve deux cases (égales OU dont la somme = 10) qui sont
   voisines, ou alignées sur une même ligne/colonne sans case
   restante entre elles.
   ========================================================= */
(function () {
  const ROWS = 8, COLS = 6;
  let grid = [];       // valeurs, null = vide
  let selected = null; // {r,c}
  let score = 0;
  let timeLeft = 90;
  let timerId = null;
  let api = null;
  let root = null;

  function rand(n) { return Math.floor(Math.random() * n); }

  function buildGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) row.push(1 + rand(9));
      grid.push(row);
    }
  }

  function cellsBetweenClear(r1, c1, r2, c2) {
    if (r1 === r2) {
      const lo = Math.min(c1, c2), hi = Math.max(c1, c2);
      for (let c = lo + 1; c < hi; c++) if (grid[r1][c] !== null) return false;
      return true;
    }
    if (c1 === c2) {
      const lo = Math.min(r1, r2), hi = Math.max(r1, r2);
      for (let r = lo + 1; r < hi; r++) if (grid[r][c1] !== null) return false;
      return true;
    }
    return false;
  }

  function isAdjacent(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && !(r1 === r2 && c1 === c2);
  }

  function canMatch(a, b) {
    if (grid[a.r][a.c] === null || grid[b.r][b.c] === null) return false;
    const va = grid[a.r][a.c], vb = grid[b.r][b.c];
    if (va !== vb && va + vb !== 10) return false;
    if (isAdjacent(a.r, a.c, b.r, b.c)) return true;
    if (cellsBetweenClear(a.r, a.c, b.r, b.c)) return true;
    return false;
  }

  function hasAnyMove() {
    const cells = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (grid[r][c] !== null) cells.push({ r, c });
    for (let i = 0; i < cells.length; i++)
      for (let j = i + 1; j < cells.length; j++)
        if (canMatch(cells[i], cells[j])) return true;
    return false;
  }

  function remainingCount() {
    let n = 0;
    grid.forEach(row => row.forEach(v => { if (v !== null) n++; }));
    return n;
  }

  function render() {
    const boardEl = root.querySelector('#nm-board');
    boardEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = grid[r][c];
        const cell = document.createElement('div');
        cell.className = 'nm-cell';
        if (v === null) {
          cell.classList.add('nm-empty');
        } else {
          cell.textContent = v;
          if (selected && selected.r === r && selected.c === c) cell.classList.add('nm-selected');
          cell.addEventListener('click', () => onCellTap(r, c));
        }
        boardEl.appendChild(cell);
      }
    }
    root.querySelector('#nm-timer').textContent = timeLeft + 's';
  }

  function onCellTap(r, c) {
    if (grid[r][c] === null) return;
    if (!selected) { selected = { r, c }; render(); return; }
    if (selected.r === r && selected.c === c) { selected = null; render(); return; }

    const a = selected, b = { r, c };
    if (canMatch(a, b)) {
      grid[a.r][a.c] = null;
      grid[b.r][b.c] = null;
      score += 10;
      api.vibrate(15);
      selected = null;
      api.onScore(score);
      if (remainingCount() === 0) {
        endGame(true, 'Grille vidée, chapeau ! 🎉');
        return;
      }
      if (!hasAnyMove()) shuffleRemaining();
      render();
    } else {
      selected = { r, c };
      render();
    }
  }

  function shuffleRemaining() {
    const values = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] !== null) values.push(grid[r][c]);
    for (let i = values.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [values[i], values[j]] = [values[j], values[i]];
    }
    let k = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] !== null) grid[r][c] = values[k++];
  }

  function tick() {
    timeLeft--;
    if (timeLeft <= 0) {
      endGame(false, "Temps écoulé !");
      return;
    }
    render();
  }

  function endGame(win, message) {
    clearInterval(timerId);
    timerId = null;
    api.onEnd({ win, score, message });
  }

  function init(container, gameApi) {
    api = gameApi;
    root = container;
    score = 0; timeLeft = 90; selected = null;
    buildGrid();
    if (!hasAnyMove()) buildGrid();

    root.innerHTML = `
      <div class="nm-wrap">
        <div class="nm-top">
          <span>⏱️ <b id="nm-timer">90s</b></span>
          <button class="tap-btn" id="nm-shuffle">🔀 Mélanger</button>
        </div>
        <div id="nm-board"></div>
        <p class="nm-hint">Touche deux cases <b>identiques</b> ou dont la <b>somme fait 10</b> (voisines ou alignées).</p>
      </div>
    `;
    root.querySelector('#nm-shuffle').addEventListener('click', () => { shuffleRemaining(); render(); });
    render();
    timerId = setInterval(tick, 1000);
    api.onScore(score);
  }

  function destroy() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  const style = document.createElement('style');
  style.textContent = `
    .nm-wrap { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; padding:14px; overflow:auto; }
    .nm-top { width:100%; max-width:360px; display:flex; justify-content:space-between; align-items:center; color:#fff; font-weight:800; margin-bottom:10px; }
    #nm-board { display:grid; grid-template-columns: repeat(6, 1fr); gap:6px; width:100%; max-width:360px; }
    .nm-cell {
      aspect-ratio:1; background:#fff; border-radius:10px; display:flex; align-items:center; justify-content:center;
      font-weight:900; font-size:18px; color:#3a2b5f; box-shadow:0 3px 0 rgba(0,0,0,0.15);
    }
    .nm-cell.nm-selected { background:#ffd166; box-shadow:0 0 0 3px #ff8c42 inset; transform:scale(0.95); }
    .nm-cell.nm-empty { background:transparent; box-shadow:none; }
    .nm-hint { color:#cbb8e6; font-size:12px; text-align:center; margin-top:12px; max-width:320px; }
  `;
  document.head.appendChild(style);

  window.Games = window.Games || {};
  window.Games.numbers = { title: 'Nombres Correspondants', init, destroy };
})();
