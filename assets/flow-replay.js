/* „So funktioniert’s“: Ein Klick auf „Senden“ in der Grafik oder auf „Noch einmal abspielen“ startet den Ablauf
   von vorn. Ohne Skript oder mit „Bewegung reduzieren“ bleibt die Grafik im Endzustand stehen. */
(function () {
  var flow = document.querySelector(".flow");
  if (!flow) return;
  var reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  function replay() {
    if (reduceMotion && reduceMotion.matches) return;
    flow.classList.remove("is-playing");
    void flow.offsetWidth; // erzwingt eine neue Berechnung, damit die CSS-Animationen wieder bei null beginnen
    flow.classList.add("is-playing");
  }

  // Für Maus und Finger: „Senden“ in der Grafik. Die Grafik ist für Vorleseprogramme ein Bild,
  // deshalb gibt es zusätzlich einen echten Knopf darunter.
  var send = flow.querySelector(".flow-send");
  if (send) {
    send.classList.add("is-replayable");
    send.title = "Noch einmal abspielen";
    send.addEventListener("click", replay);
  }

  var button = document.createElement("button");
  button.type = "button";
  button.className = "flow-replay";
  button.textContent = "Noch einmal abspielen";
  button.addEventListener("click", replay);
  var caption = flow.querySelector("figcaption");
  (caption ? caption.parentNode : flow).insertBefore(button, caption ? caption.nextSibling : null);
})();
