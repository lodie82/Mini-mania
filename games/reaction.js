/* =========================================================
   MINI-JEU : RÉFLEXE
   Attends que le cercle devienne vert puis touche-le !
   ========================================================= */
(function () {
  let root, api;
  let ready = false;
  let startTime = 0;
  let score = 0;
  let best = Infinity;
  let timeoutId = null;

  function init(container, gameApi) {
    root = container;
    api = gameApi;

    score = 0;
    ready = false;

    root.innerHTML = `
      <div class="rx-wrap">
        <div class="rx-top">
          <span>⚡ Réflexe</span>
          <span>Meilleur : <b id="rx-best">-</b></span>
        </div>

        <div id="rx-area" class="rx-area">
          <div id="rx-circle" class="rx-circle">
            ATTENDS...
          </div>
        </div>

        <p id="rx-message" class="rx-message">
          Attends que le cercle devienne vert !
        </p>
      </div>
    `;

    best = Number(localStorage.getItem("miniManiaReactionBest")) || Infinity;

    root.querySelector("#rx-best").textContent =
      best === Infinity ? "-" : best + " ms";

    root.querySelector("#rx-area").addEventListener("pointerdown", handleTap);

    api.onScore(0);

    startRound();
  }

  function startRound() {
    clearTimeout(timeoutId);

    ready = false;

    const circle = root.querySelector("#rx-circle");
    const message = root.querySelector("#rx-message");

    circle.className = "rx-circle rx-wait";
    circle.textContent = "ATTENDS...";
    message.textContent = "Ne touche pas encore !";

    timeoutId = setTimeout(() => {
      ready = true;
      startTime = performance.now();

      circle.className = "rx-circle rx-go";
      circle.textContent = "GO !";
      message.textContent = "TOUCHE !";
    }, 1200 + Math.random() * 2500);
  }

  function handleTap() {
    if (!ready) {
      clearTimeout(timeoutId);

      const message = root.querySelector("#rx-message");
      const circle = root.querySelector("#rx-circle");

      circle.className = "rx-circle rx-tooearly";
      circle.textContent = "OUPS !";
      message.textContent = "Trop tôt 😅";

      api.vibrate(40);

      setTimeout(startRound, 1000);
      return;
    }

    const reaction = Math.round(performance.now() - startTime);

    ready = false;
    score++;

    api.vibrate(20);
    api.onScore(score);

    const circle = root.querySelector("#rx-circle");
    const message = root.querySelector("#rx-message");

    circle.className = "rx-circle rx-result";
    circle.textContent = reaction + " ms";

    message.textContent =
      reaction < 250 ? "🔥 INCROYABLE !" :
      reaction < 400 ? "👏 Très rapide !" :
      "👍 Bien joué !";

    if (reaction < best) {
      best = reaction;
      localStorage.setItem("miniManiaReactionBest", best);

      root.querySelector("#rx-best").textContent = best + " ms";
    }

    if (score >= 10) {
      api.onEnd({
        win: true,
        score: score,
        message: "10 réflexes réussis ! Tu es rapide ⚡"
      });
      return;
    }

    setTimeout(startRound, 900);
  }

  function destroy() {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  const style = document.createElement("style");

  style.textContent = `
    .rx-wrap {
      width:100%;
      height:100%;
      display:flex;
      flex-direction:column;
      align-items:center;
      padding:14px;
      box-sizing:border-box;
      color:#fff;
    }

    .rx-top {
      width:100%;
      max-width:340px;
      display:flex;
      justify-content:space-between;
      font-weight:800;
      margin-bottom:15px;
    }

    .rx-area {
      width:100%;
      max-width:340px;
      aspect-ratio:1;
      min-height:280px;
      background:#211637;
      border-radius:25px;
      display:flex;
      align-items:center;
      justify-content:center;
      touch-action:manipulation;
      box-shadow:0 8px 25px rgba(0,0,0,.35);
    }

    .rx-circle {
      width:150px;
      height:150px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:23px;
      font-weight:900;
      transition:.2s;
      user-select:none;
    }

    .rx-wait {
      background:#e94b4b;
      box-shadow:0 0 30px rgba(233,75,75,.5);
    }

    .rx-go {
      background:#36e35b;
      box-shadow:0 0 45px rgba(54,227,91,.8);
      transform:scale(1.08);
    }

    .rx-tooearly {
      background:#ff9f1c;
    }

    .rx-result {
      background:#24b7e8;
    }

    .rx-message {
      color:#d9c9ed;
      text-align:center;
      font-size:14px;
      margin-top:18px;
    }
  `;

  document.head.appendChild(style);

  window.Games = window.Games || {};

  window.Games.reaction = {
    title: "Réflexe",
    init,
    destroy
  };
})();
