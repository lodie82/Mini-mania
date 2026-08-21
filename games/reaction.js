// MINI-MANIA — REACTION
// Jeu de réflexe tactile

(function () {
    window.MiniManiaGames = window.MiniManiaGames || {};

    window.MiniManiaGames.reaction = function (container) {
        container.innerHTML = `
            <div id="reactionGame" style="
                width:100%;height:100%;min-height:500px;
                background:linear-gradient(160deg,#5423a8,#a846d8);
                border-radius:25px;padding:20px;box-sizing:border-box;
                color:white;font-family:Arial,sans-serif;text-align:center;
                overflow:hidden;position:relative;">
                
                <h1 style="font-size:32px;margin:10px 0;">⚡ RÉFLEXE</h1>
                <p id="reactionInfo" style="font-size:18px;">Appuie quand le cercle devient VERT !</p>

                <div id="reactionArea" style="
                    width:100%;height:330px;border-radius:25px;
                    background:#27223a;display:flex;
                    align-items:center;justify-content:center;
                    margin-top:20px;touch-action:manipulation;">
                    
                    <div id="reactionCircle" style="
                        width:150px;height:150px;border-radius:50%;
                        background:#e53935;display:flex;
                        align-items:center;justify-content:center;
                        font-size:28px;font-weight:bold;
                        box-shadow:0 10px 30px #0008;">
                        ATTENDS
                    </div>
                </div>

                <div style="margin-top:20px;font-size:20px;">
                    Score : <b id="reactionScore">0</b>
                </div>
                <div style="margin-top:8px;font-size:18px;">
                    Meilleur : <b id="reactionBest">0</b> ms
                </div>
            </div>
        `;

        const area = container.querySelector("#reactionArea");
        const circle = container.querySelector("#reactionCircle");
        const info = container.querySelector("#reactionInfo");
        const scoreEl = container.querySelector("#reactionScore");
        const bestEl = container.querySelector("#reactionBest");

        let ready = false;
        let startTime = 0;
        let score = 0;
        let timeout;

        let best = Number(localStorage.getItem("reactionBest") || 9999);
        bestEl.textContent = best === 9999 ? "-" : best;

        function nextRound() {
            ready = false;
            circle.style.background = "#e53935";
            circle.textContent = "ATTENDS";
            info.textContent = "Attends le VERT...";

            clearTimeout(timeout);

            timeout = setTimeout(() => {
                ready = true;
                startTime = performance.now();
                circle.style.background = "#32d74b";
                circle.textContent = "GO !";
                info.textContent = "MAINTENANT !";
            }, 1000 + Math.random() * 2500);
        }

        function tap() {
            if (!ready) {
                clearTimeout(timeout);
                info.textContent = "Trop tôt ! 😅";
                circle.style.background = "#ff9500";
                circle.textContent = "OUPS";
                setTimeout(nextRound, 1000);
                return;
            }

            const reaction = Math.round(performance.now() - startTime);
            ready = false;

            score++;
            scoreEl.textContent = score;

            if (reaction < best) {
                best = reaction;
                bestEl.textContent = reaction;
                localStorage.setItem("reactionBest", best);
            }

            circle.textContent = reaction + " ms";
            circle.style.background = "#00bcd4";
            info.textContent = "Excellent ! 🔥";

            setTimeout(nextRound, 1000);
        }

        area.addEventListener("pointerdown", tap);
        nextRound();
    };
})();
