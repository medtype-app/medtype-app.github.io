/* „So funktioniert’s“: Ein Klick auf „Senden“ in der Grafik startet den Ablauf von vorn.
   Ohne Skript oder mit „Bewegung reduzieren“ bleibt die Grafik im Endzustand stehen. */
(function () {
  var flow = document.querySelector(".flow");
  var send = flow && flow.querySelector(".flow-send");
  if (!send) return;
  var reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  send.classList.add("is-replayable");
  send.title = "Noch einmal abspielen";
  send.addEventListener("click", function () {
    if (reduceMotion && reduceMotion.matches) return;
    flow.classList.remove("is-playing");
    void flow.offsetWidth; // erzwingt eine neue Berechnung, damit die CSS-Animationen wieder bei null beginnen
    flow.classList.add("is-playing");
  });
})();
