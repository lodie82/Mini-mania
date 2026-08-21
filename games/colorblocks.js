/* =========================================================
   MINI-JEU 2 : COLOR BLOCKS (façon Tetris, tactile)
   Glisse à gauche/droite pour déplacer, glisse vers le bas
   pour faire tomber vite, appuie pour tourner.
   ========================================================= */
(function () {
  const COLS = 8, ROWS = 14;
  let cellSize = 0;
  let canvas, ctx, root, api;
  let board, current, nextPiece, score, lines, dropInterval, dropTimer, rafId;
  let lastTime = 0, accum = 0;
  let gameOver = false;

  const COLORS = ['#ff5d5d', '#ffb84d', '#ffe066', '#7be07b', '#5db9ff', '#b48cff', '#ff7ad9'];
  const SHAPES = [
    [[1, 1, 1, 1]],                 // I
    [[1, 1], [1, 1]],               // O
    [[0, 1, 0], [1, 1, 1]],         // T
    [[1, 0, 0], [1, 1, 1]],         // J
    [[0, 0, 1], [1, 1, 1]],         // L
    [[1, 1, 0], [0, 1, 1]],         // S
    [[0, 1, 1], [1, 1, 0]]          // Z
  ];

  function rand(n) { return Math.floor(Math.random() * n); }

  function newPiece() {
    const idx = rand(SHAPES.length);
    const shape = SHAPES[idx].map(r => r.slice());
    return { shape, color: COLORS[idx], r: 0, c: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2) };
  }

  function rotate(shape) {
    const h = shape.length, w = shape[0].length;
    const res = [];
    for (let x = 0; x < w; x++) {
      const row = [];
      for (let y = h - 1; y >= 0; y--) row.push(shape[y][x]);
      res.push(row);
    }
    return res;
  }

  function collides(shape, r, c) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const gr = r + y, gc = c + x;
        if (gc < 0 || gc >= COLS || gr >= ROWS) return true;
        if (gr >= 0 && board[gr][gc]) return true;
      }
    }
    return false;
  }

  function lockPiece() {
    current.shape.forEach((row, y) => row.forEach((v, x) => {
      if (v) {
        const gr = current.r + y, gc = current.c + x;
        if (gr >= 0) board[gr][gc] = current.color;
      }
    }));
    clearLines();
    current = nextPiece;
    nextPiece = newPiece();
    if (collides(current.shape, current.r, current.c)) {
      endGame();
    }
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(v => v)) {
        board.splice(r, 1);
        board.unshift(new Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      lines += cleared;
      score += [0, 100, 300, 600, 1000][cleared] || cleared * 300;
      dropInterval = Math.max(220, 700 - lines * 15);
      api.onScore(score);
      api.vibrate(20);
    }
  }

  function softDrop() {
    if (gameOver) return;
    if (!collides(current.shape, current.r + 1, current.c)) {
      current.r++;
    } else {
      lockPiece();
    }
    draw();
  }

  function hardDrop() {
    if (gameOver) return;
    while (!collides(current.shape, current.r + 1, current.c)) current.r++;
    lockPiece();
    draw();
    api.vibrate(25);
  }

  function move(dx) {
    if (gameOver) return;
    if (!collides(current.shape, current.r, current.c + dx)) { current.c += dx; draw(); }
  }

  function doRotate() {
    if (gameOver) return;
    const rotated = rotate(current.shape);
    let c = current.c;
    if (collides(rotated, current.r, c)) {
      // wall kicks
      if (!collides(rotated, current.r, c - 1)) c -= 1;
      else if (!collides(rotated, current.r, c + 1)) c += 1;
      else return;
    }
    current.shape = rotated;
    current.c = c;
    draw();
  }

  function resize() {
    const w = root.clientWidth, h = root.clientHeight;
    cellSize = Math.floor(Math.min(w / COLS, h / ROWS));
    canvas.width = cellSize * COLS;
    canvas.height = cellSize * ROWS;
    draw();
  }

  function drawCell(r, c, color) {
    const x = c * cellSize, y = r * cellSize;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x + 1, y + 1, cellSize - 2, 4);
  }

  function draw() {
    ctx.fillStyle = '#241a3d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (board[r][c]) drawCell(r, c, board[r][c]);
    if (current) {
      current.shape.forEach((row, y) => row.forEach((v, x) => {
        if (v && current.r + y >= 0) drawCell(current.r + y, current.c + x, current.color);
      }));
    }
    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * cellSize, 0); ctx.lineTo(c * cellSize, canvas.height); ctx.stroke(); }
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * cellSize); ctx.lineTo(canvas.width, r * cellSize); ctx.stroke(); }
  }

  function loop(t) {
    if (gameOver) return;
    if (!lastTime) lastTime = t;
    const dt = t - lastTime;
    lastTime = t;
    accum += dt;
    if (accum > dropInterval) { accum = 0; softDrop(); }
    rafId = requestAnimationFrame(loop);
  }

  // ---- touch controls ----
  let touchStartX = 0, touchStartY = 0, touchMoved = false, lastMoveX = 0;
  function onTouchStart(e) {
    const t = e.touches[0];
    touchStartX = t.clientX; touchStartY = t.clientY; lastMoveX = t.clientX;
    touchMoved = false;
  }
  function onTouchMove(e) {
    const t = e.touches[0];
    const dx = t.clientX - lastMoveX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > cellSize * 0.7) {
      move(dx > 0 ? 1 : -1);
      lastMoveX = t.clientX;
      touchMoved = true;
    }
    if (dy > cellSize * 1.5) {
      hardDrop();
      touchMoved = true;
      touchStartY = t.clientY;
    }
  }
  function onTouchEnd(e) {
    if (!touchMoved) doRotate();
  }

  function endGame() {
    gameOver = true;
    if (rafId) cancelAnimationFrame(rafId);
    api.onEnd({ win: lines >= 10, score, message: `Tu as complété ${lines} ligne(s) !` });
  }

  function init(container, gameApi) {
    api = gameApi; root = container;
    board = Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
    score = 0; lines = 0; dropInterval = 700; gameOver = false; lastTime = 0; accum = 0;
    current = newPiece(); nextPiece = newPiece();

    root.innerHTML = `<canvas id="cb-canvas"></canvas>
      <div class="cb-controls">
        <button class="tap-btn" id="cb-left">⬅️</button>
        <button class="tap-btn" id="cb-rotate">🔄</button>
        <button class="tap-btn" id="cb-right">➡️</button>
        <button class="tap-btn" id="cb-down">⬇️</button>
      </div>`;
    canvas = root.querySelector('#cb-canvas');
    ctx = canvas.getContext('2d');

    root.querySelector('#cb-left').addEventListener('click', () => move(-1));
    root.querySelector('#cb-right').addEventListener('click', () => move(1));
    root.querySelector('#cb-rotate').addEventListener('click', () => doRotate());
    root.querySelector('#cb-down').addEventListener('click', () => hardDrop());

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    resize();
    api.onScore(score);
    rafId = requestAnimationFrame(loop);
  }

  function destroy() {
    gameOver = true;
    if (rafId) cancelAnimationFrame(rafId);
  }

  const style = document.createElement('style');
  style.textContent = `
    #cb-canvas { border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,0.4); }
    .cb-controls { position:absolute; bottom:16px; left:0; right:0; display:flex; justify-content:center; gap:10px; }
  `;
  document.head.appendChild(style);

  window.Games = window.Games || {};
  window.Games.colorblocks = { title: 'Color Blocks', init, destroy };
})();
