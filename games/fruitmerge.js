/* =========================================================
   MINI-JEU 4 : FUSION DE FRUITS
   Touche une colonne pour faire tomber le fruit. Deux fruits
   identiques empilés fusionnent en un fruit plus gros !
   ========================================================= */
(function () {
  const COLS = 6, ROWS = 8;
  const TIERS = [
    { emoji: '🫐', size: 20 }, { emoji: '🍓', size: 26 }, { emoji: '🍋', size: 32 },
    { emoji: '🍊', size: 38 }, { emoji: '🍎', size: 44 }, { emoji: '🍉', size: 54 }
  ];

  let root, api, board, score, nextTier, timeLeft, timerId, cellsEls;

  function rand(n) { return Math.floor(Math.random() * n); }
  function randomNextTier() { return rand(10) < 7 ? 0 : (rand(2)); } // mostly tier 0, sometimes 1

  function lowestEmptyRow(col) {
    for (let r = ROWS - 1; r >= 0; r--) if (board[r][col] === null) return r;
    return -1;
  }

  function boardFull() {
    for (let c = 0; c < COLS; c++) if (lowestEmptyRow(c) !== -1) return false;
    return true;
  }

  function drop(col) {
    const row = lowestEmptyRow(col);
    if (row === -1) { api.vibrate(30); return; }
    let tier = nextTier;
    board[row][col] = tier;
    api.vibrate(10);

    // chain merge downward
    let curRow = row;
    while (curRow + 1 < ROWS && board[curRow + 1][col] === tier) {
      board[curRow][col] = null;
      board[curRow + 1][col] = null;
      const newTier = Math.min(tier + 1, TIERS.length - 1);
      board[curRow + 1][col] = newTier;
      score += (newTier + 1) * 10;
      api.vibrate(20);
      tier = newTier;
      curRow = curRow + 1;
    }

    api.onScore(score);
    nextTier = randomNextTier();
    renderNext();
    renderBoard();

    if (boardFull()) endGame(false);
  }

  function renderBoard() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const el = cellsEls[r][c];
        const v = board[r][c];
        if (v === null) { el.textContent = ''; el.style.fontSize = '0px'; }
        else { el.textContent = TIERS[v].emoji; el.style.fontSize = TIERS[v].size + 'px'; }
      }
    }
  }

  function renderNext() {
    root.querySelector('#fm-next').textContent = TIERS[nextTier].emoji;
  }

  function tick() {
    timeLeft--;
    root.querySelector('#fm-timer').textContent = timeLeft + 's';
    if (timeLeft <= 0) endGame(true);
  }

  function endGame(timeUp) {
    clearInterval(timerId);
    timerId = null;
    const win = score >= 150;
    api.onEnd({
      win,
      score,
      message: timeUp ? "Temps écoulé ! Beau travail de fusion." : "Le plateau est plein !"
    });
  }

  function init(container, gameApi) {
    api = gameApi; root = container;
    board = Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
    score = 0; timeLeft = 75; nextTier = randomNextTier();

    root.innerHTML = `
      <div class="fm-wrap">
        <div class="fm-top">
          <span>⏱️ <b id="fm-timer">75s</b></span>
          <span>Prochain : <span id="fm-next" class="fm-next-emoji"></span></span>
        </div>
        <div id="fm-board" class="fm-board"></div>
        <p class="fm-hint">Touche une colonne pour faire tomber le fruit.</p>
      </div>`;

    const boardEl = root.querySelector('#fm-board');
    cellsEls = [];
    for (let r = 0; r < ROWS; r++) {
      const rowArr = [];
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'fm-cell';
        cell.dataset.col = c;
        boardEl.appendChild(cell);
        rowArr.push(cell);
      }
      cellsEls.push(rowArr);
    }
    boardEl.addEventListener('click', (e) => {
      const cell = e.target.closest('.fm-cell');
      if (!cell) return;
      drop(parseInt(cell.dataset.col, 10));
    });

    renderNext();
    renderBoard();
    api.onScore(score);
    timerId = setInterval(tick, 1000);
  }

  function destroy() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  const style = document.createElement('style');
  style.textContent = `
    .fm-wrap { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; padding:14px; overflow:auto; }
    .fm-top { width:100%; max-width:340px; display:flex; justify-content:space-between; color:#fff; font-weight:800; margin-bottom:10px; }
    .fm-next-emoji { font-size:20px; }
    .fm-board {
      display:grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(8, 1fr);
      gap:4px; width:100%; max-width:340px; aspect-ratio: 6/8;
      background:#2e2050; padding:6px; border-radius:14px; box-shadow:0 6px 20px rgba(0,0,0,0.35);
    }
    .fm-cell { background:rgba(255,255,255,0.08); border-radius:8px; display:flex; align-items:center; justify-content:center; transition:font-size .15s; }
    .fm-hint { color:#cbb8e6; font-size:12px; text-align:center; margin-top:12px; max-width:300px; }
  `;
  document.head.appendChild(style);

  window.Games = window.Games || {};
  window.Games.fruitmerge = { title: 'Fusion de Fruits', init, destroy };
})();
