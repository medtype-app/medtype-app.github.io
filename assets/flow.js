/* „So funktioniert’s“: Sobald die Szene ins Bild kommt, tippt „Senden“ auf dem Smartphone den Text über den Dongle
   Zeichen für Zeichen in das Textfeld auf dem Tablet-PC. „Noch einmal abspielen“ (oder „Senden“ in der Grafik)
   startet den Ablauf jederzeit von vorn. Ohne Skript oder mit „Bewegung reduzieren“ bleibt die Szene im Endzustand. */
(function () {
  "use strict";

  var flow = document.querySelector(".flow");
  var typed = flow && flow.querySelector(".fl-typed");
  if (!typed || !("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var TAP_AT = 700; // Fingertipp auf „Senden“
  var SEND_AT = 1050; // Fortschritt erscheint, Funkstrecke und LED arbeiten
  var TYPE_AT = 1450; // erstes Zeichen am PC
  var CHAR_MS = 42; // Tippgeschwindigkeit
  var ENTER_PAUSE_MS = 260; // „Pause nach Zeilenumbruch“ wie in der App

  var text = typed.textContent;
  var bar = flow.querySelector(".fl-pbar i");
  var count = flow.querySelector(".fl-pcount");
  var send = flow.querySelector(".fl-send");
  var timers = [];

  var replay = document.createElement("button");
  replay.type = "button";
  replay.className = "flow-replay";
  replay.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
    ' stroke-linejoin="round" aria-hidden="true"><path d="M3.5 10a6.5 6.5 0 1 0 2-4.7"/><path d="M3.5 3v3.5H7"/></svg>' +
    "Noch einmal abspielen";
  flow.querySelector(".flow-frame").appendChild(replay);

  function later(ms, fn) {
    timers.push(window.setTimeout(fn, ms));
  }

  function setState(state) {
    flow.setAttribute("data-state", state);
  }

  /* Zeigt die ersten n Zeichen im Textfeld und den passenden Fortschritt auf dem Smartphone. */
  function show(n) {
    typed.textContent = text.slice(0, n);
    count.textContent = n;
    bar.style.setProperty("--p", n / text.length);
  }

  function typeFrom(n) {
    show(n);
    if (n >= text.length) {
      later(250, function () { setState("done"); });
      return;
    }
    var pause = text.charAt(n - 1) === "\n" ? ENTER_PAUSE_MS : 0;
    later(CHAR_MS + pause, function () { typeFrom(n + 1); });
  }

  function play() {
    timers.forEach(window.clearTimeout);
    timers = [];
    show(0);
    setState("ready");
    later(TAP_AT, function () { setState("tap"); });
    later(SEND_AT, function () { setState("sending"); });
    later(TYPE_AT, function () { typeFrom(1); });
  }

  replay.addEventListener("click", play);
  send.classList.add("is-replayable");
  send.addEventListener("click", function () {
    if (flow.getAttribute("data-state") === "done") play();
  });

  // Vorbereiten, damit das Textfeld leer ist, bevor die Szene ins Bild kommt
  show(0);
  setState("ready");
  var io = new IntersectionObserver(function (entries) {
    if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
    io.disconnect();
    play();
  }, { threshold: 0.5 });
  io.observe(flow.querySelector(".flow-stage"));
})();
