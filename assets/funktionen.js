/* MedType – Seite „Funktionen“: spielt die Vorführungen ab. Jede Vorführung ist ein Ablauf aus Schritten mit Zeitpunkt
   (Script). Sie startet, sobald sie ins Bild kommt, hält an, wenn sie aus dem Bild scrollt, und lässt sich über den
   Knopf anhalten, fortsetzen und wiederholen. Mit „Bewegung reduzieren“ startet nichts von selbst: Die Szene zeigt den
   Endzustand, und der Knopf spielt die Vorführung auf Wunsch ab. Ohne Skript bleibt der Endzustand aus dem HTML stehen. */
(function () {
  "use strict";

  var figures = document.querySelectorAll(".fx-demo[data-demo]");
  if (!figures.length || !window.requestAnimationFrame) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var MAX_STEP_MS = 250; // längster Zeitsprung pro Bild (gedrosselte Tabs springen nicht durch die ganze Vorführung)
  var SPEED = 30; // Zeichen pro Sekunde, Standard der App
  var KONTROLLE = "Kontrolle in vier Wochen, bei Beschwerden bitte früher vorstellen.";

  /* ---------- Werkzeuge ---------- */

  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function context(fig) {
    var c = { fig: fig };
    c.q = function (name) { return fig.querySelector('[data-fx="' + name + '"]'); };
    c.phone = c.q("phone");
    c.screen = c.q("screen");
    c.touch = c.q("touch");
    c.steps = fig.closest(".fx").querySelectorAll(".fx-steps > li");
    c.pc = fig.querySelector(".fx-pc");
    c.before = c.q("before");
    c.after = c.q("after");
    c.row = function (key) { return fig.querySelector('[data-row="' + key + '"]'); };
    c.key = function (k) { return /^[a-zäöü ]$|^(shift|back|ret)$/.test(k) ? fig.querySelector('.fx-key[data-k="' + k + '"]') : null; };
    return c;
  }

  /* Lage des Fingers: Mitte des Ziels, in Prozent des Bildschirms (die Szene skaliert mit) */
  function aim(c, el, x) {
    var s = c.screen.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    if (!s.width || !s.height) return;
    var left = x === undefined ? r.left + r.width / 2 : x;
    c.touch.style.left = ((left - s.left) / s.width * 100) + "%";
    c.touch.style.top = ((r.top + r.height / 2 - s.top) / s.height * 100) + "%";
  }

  function on(el, cls, yes) { if (el) el.classList.toggle(cls, yes !== false); }
  function text(el, value) { if (el) el.textContent = value; }
  function phoneState(c, cls, yes) { on(c.phone, cls, yes); }

  function led(el, state) {
    if (!el) return;
    ["slow", "fast", "on", "typing", "paired"].forEach(function (s) { el.classList.remove("fx-led-" + s); });
    el.classList.add("fx-led-" + state);
  }

  function pcText(c, before, after) {
    text(c.before, before);
    text(c.after, after || "");
  }

  function summary(n) {
    return n ? n + " Zeichen · ca. " + Math.ceil(n / SPEED) + " Sek." : "0 Zeichen";
  }

  function progress(c, done, total, title) {
    if (title) text(c.q("ptitle"), title);
    text(c.q("pcount"), done + " von " + total + " Zeichen");
    var bar = c.fig.querySelector(".dv-pbar i");
    if (bar) bar.style.setProperty("--p", total ? done / total : 0);
  }

  function bubble(c, word) {
    var i = document.createElement("i");
    var em = document.createElement("em");
    em.textContent = word;
    i.appendChild(em);
    c.q("history").appendChild(i);
    c.chip = null;
  }

  var KEY_ICON = { left: "left", right: "right", up: "up", down: "down" };
  function keyChip(c, key) {
    if (c.chip && c.chip.key === key) {
      c.chip.count += 1;
      c.chip.em.textContent = "×" + c.chip.count;
      return;
    }
    var i = document.createElement("i");
    i.className = "fx-keychip";
    i.innerHTML = '<svg viewBox="0 0 20 20"><use href="#i-' + KEY_ICON[key] + '"/></svg><em></em>';
    c.q("history").appendChild(i);
    c.chip = { key: key, count: 1, em: i.querySelector("em") };
  }

  /* ---------- Ablauf ---------- */

  function Script(c) { this.c = c; this.t = 0; this.ev = []; }
  Script.prototype.at = function (fn) { this.ev.push({ t: this.t, fn: fn }); return this; };
  Script.prototype.wait = function (ms) { this.t += ms; return this; };
  Script.prototype.step = function (n) {
    var steps = this.c.steps;
    return this.at(function () {
      Array.prototype.forEach.call(steps, function (li, i) { li.classList.toggle("is-now", i === n - 1); });
    });
  };
  /* Fingertipp mit kurzem Druck auf das Ziel; el darf eine Funktion sein (Ziel erst beim Abspielen bekannt) */
  Script.prototype.tap = function (el) {
    var c = this.c;
    var target = null;
    this.at(function () {
      target = typeof el === "function" ? el() : el;
      if (!target) return;
      aim(c, target);
      restart(c.touch, "is-tap");
      target.classList.add("is-pressed");
    });
    this.wait(180).at(function () { if (target) target.classList.remove("is-pressed"); });
    return this.wait(120);
  };
  /* Zeichen für Zeichen: fn(bisher, zeichen) nach jeweils ms; nach Zeilenumbrüchen etwas länger */
  Script.prototype.chars = function (str, ms, fn) {
    for (var i = 1; i <= str.length; i++) {
      this.wait(ms + (str.charAt(i - 2) === "\n" ? 140 : 0));
      this.at(fn.bind(null, str.slice(0, i), str.charAt(i - 1)));
    }
    return this;
  };
  /* Taste auf der Bildschirmtastatur kurz hervorheben */
  Script.prototype.key = function (k) {
    var c = this.c;
    return this.at(function () {
      if (c.down) c.down.classList.remove("is-down");
      c.down = c.key(k);
      if (c.down) c.down.classList.add("is-down");
    });
  };
  Script.prototype.release = function () {
    var c = this.c;
    return this.at(function () { if (c.down) c.down.classList.remove("is-down"); c.down = null; });
  };
  /* Live tippen: Zeichen in die Eingabezeile und sofort an den PC; ein Leerzeichen schickt das Wort in den Verlauf */
  Script.prototype.live = function (str, ms) {
    var c = this.c;
    var s = this;
    str.split("").forEach(function (ch) {
      var upper = ch !== ch.toLowerCase();
      if (upper) s.wait(ms / 2).key("shift");
      s.wait(upper ? ms / 2 : ms).key(ch === " " ? " " : ch.toLowerCase()).at(function () {
        var line = c.q("line");
        c.before.textContent += ch;
        if (ch === " ") {
          if (line.textContent) bubble(c, line.textContent);
          line.textContent = "";
        } else {
          line.textContent += ch;
        }
      });
    });
    return this.wait(ms).release();
  };
  Script.prototype.backspace = function (n, ms) {
    var c = this.c;
    for (var i = 0; i < n; i++) {
      this.wait(ms).key("back").at(function () {
        var line = c.q("line");
        line.textContent = line.textContent.slice(0, -1);
        c.before.textContent = c.before.textContent.slice(0, -1);
      });
    }
    return this.wait(ms).release();
  };

  /* ---------- Vorführungen ---------- */

  var DEMOS = {};

  DEMOS.vorschreiben = {
    reset: function (c) {
      text(c.q("text"), "");
      text(c.q("sum"), summary(0));
      on(c.q("field"), "is-empty");
      phoneState(c, "is-empty");
      phoneState(c, "is-busy", false);
      phoneState(c, "is-done", false);
      pcText(c, "");
      led(c.q("usb"), "on");
      on(c.pc, "is-air", false);
    },
    run: function (s, c) {
      var draft = "Befund besprochen.\nKontrolle in vier Wochen.";
      s.step(1).wait(1100).step(2);
      s.chars(draft, 60, function (sofar) {
        text(c.q("text"), sofar);
        text(c.q("sum"), summary(sofar.length));
        on(c.q("field"), "is-empty", false);
        phoneState(c, "is-empty", false);
      });
      s.wait(800).step(3).tap(c.q("send"));
      s.at(function () {
        progress(c, 0, draft.length, "Text wird getippt");
        phoneState(c, "is-busy");
        on(c.pc, "is-air");
        led(c.q("usb"), "typing");
      }).wait(350);
      s.chars(draft, 1000 / SPEED, function (sofar) {
        pcText(c, sofar);
        progress(c, sofar.length, draft.length);
      });
      s.wait(250).step(4).at(function () {
        phoneState(c, "is-done");
        on(c.pc, "is-air", false);
        led(c.q("usb"), "on");
      });
      s.wait(500).at(function () {
        text(c.q("text"), "");
        text(c.q("sum"), summary(0));
        on(c.q("field"), "is-empty");
        phoneState(c, "is-empty");
      });
      s.wait(2600).at(function () { phoneState(c, "is-busy", false); }).wait(400).step(0);
    }
  };

  DEMOS["live-tippen"] = {
    reset: function (c) {
      c.q("history").textContent = "";
      ["Blutdruck", "128/82", "mmHg,"].forEach(function (w) { bubble(c, w); });
      c.chip = null;
      text(c.q("line"), "");
      pcText(c, "Blutdruck 128/82 mmHg, ");
      led(c.q("usb"), "on");
    },
    run: function (s, c) {
      s.step(1).wait(1000).step(2).at(function () { led(c.q("usb"), "typing"); });
      s.live("Puls kräftig, rhythmish", 150);
      s.wait(500).step(3).backspace(2, 260);
      s.wait(300).step(2).live("sch.", 150).at(function () { led(c.q("usb"), "on"); });
      s.wait(700).step(4);
      var arrows = c.fig.querySelectorAll(".fx-arrows > span");
      function move(dir) {
        return function () {
          var line = c.q("line");
          if (line.textContent) {
            bubble(c, line.textContent);
            line.textContent = "";
          }
          keyChip(c, dir < 0 ? "left" : "right");
          var b = c.before.textContent;
          var a = c.after.textContent;
          if (dir < 0 && b) pcText(c, b.slice(0, -1), b.slice(-1) + a);
          if (dir > 0 && a) pcText(c, b + a.charAt(0), a.slice(1));
        };
      }
      for (var i = 0; i < 3; i++) s.tap(arrows[0]).at(move(-1)).wait(220);
      s.wait(400);
      for (var j = 0; j < 3; j++) s.tap(arrows[3]).at(move(1)).wait(220);
      s.wait(2200).step(0);
    }
  };

  DEMOS.diktieren = {
    reset: function (c) {
      c.q("history").textContent = "";
      text(c.q("line"), "");
      pcText(c, "");
      phoneState(c, "is-dictating", false);
      led(c.q("usb"), "on");
    },
    run: function (s, c) {
      var words = ["Patient", " wach", " und", " orientiert,", " keine", " Schmerzen."];
      s.step(1).wait(1000).tap(c.q("mic")).at(function () { phoneState(c, "is-dictating"); });
      s.wait(900).step(2);
      words.forEach(function (w, i) {
        s.wait(i ? 520 : 0).at(function () {
          var line = c.q("line");
          line.textContent += w;
          led(c.q("usb"), "typing");
          on(c.pc, "is-air");
          c.before.textContent += w;
        }).wait(160).at(function () {
          led(c.q("usb"), "on");
          on(c.pc, "is-air", false);
        });
      });
      s.wait(1600).step(3).at(function () { phoneState(c, "is-dictating", false); }).wait(500);
      s.at(function () {
        var line = c.q("line");
        var words = line.textContent.split(" ");
        line.textContent = words.pop();
        words.forEach(function (w) { bubble(c, w); });
      });
      s.wait(2600).step(0);
    }
  };

  DEMOS.bausteine = {
    reset: function (c) {
      var list = c.q("list");
      var row = c.row("kontrolle");
      list.appendChild(row);
      row.classList.add("is-hidden");
      row.classList.remove("is-new", "is-lift");
      Array.prototype.forEach.call(list.children, function (r) { r.style.transform = ""; r.style.transitionDuration = ""; });
      phoneState(c, "is-sheet", false);
      text(c.q("title"), "");
      text(c.q("body"), "");
      c.q("tph").hidden = false;
      c.q("bph").hidden = false;
      on(c.q("tbox"), "is-focus", false);
      on(c.q("bbox"), "is-focus", false);
      on(c.q("save"), "is-off");
      c.touch.classList.remove("is-hold");
    },
    run: function (s, c) {
      s.step(1).wait(1100).tap(c.q("plus")).at(function () { phoneState(c, "is-sheet"); });
      s.wait(800).step(2).at(function () { on(c.q("tbox"), "is-focus"); });
      s.chars("Kontrolle", 90, function (sofar) {
        text(c.q("title"), sofar);
        c.q("tph").hidden = true;
      });
      s.wait(400).at(function () {
        on(c.q("tbox"), "is-focus", false);
        on(c.q("bbox"), "is-focus");
      });
      s.chars(KONTROLLE, 32, function (sofar) {
        text(c.q("body"), sofar);
        c.q("bph").hidden = true;
        on(c.q("save"), "is-off", false);
      });
      s.wait(600).tap(c.q("save")).at(function () { phoneState(c, "is-sheet", false); });
      s.wait(550).at(function () {
        var row = c.row("kontrolle");
        row.classList.remove("is-hidden");
        restart(row, "is-new");
      });
      /* An den drei Strichen nach oben ziehen */
      var rowH = 0;
      s.wait(1500).step(3).at(function () {
        var row = c.row("kontrolle");
        rowH = row.getBoundingClientRect().height;
        aim(c, row.querySelector("svg"));
        c.touch.classList.add("is-hold");
        row.classList.add("is-lift");
      });
      s.wait(450).at(function () {
        var list = c.q("list");
        var row = c.row("kontrolle");
        var screenH = c.screen.getBoundingClientRect().height;
        var others = Array.prototype.filter.call(list.children, function (r) { return r !== row && !r.classList.contains("is-hidden"); });
        row.style.transitionDuration = ".8s";
        row.style.transform = "translateY(" + (-rowH * others.length) + "px)";
        others.forEach(function (r) { r.style.transform = "translateY(" + rowH + "px)"; });
        c.touch.style.top = (parseFloat(c.touch.style.top) - rowH * others.length / screenH * 100) + "%";
      });
      s.wait(1000).at(function () {
        var list = c.q("list");
        var row = c.row("kontrolle");
        c.touch.classList.remove("is-hold");
        row.classList.remove("is-lift", "is-new");
        Array.prototype.forEach.call(list.children, function (r) { r.style.transition = "none"; r.style.transform = ""; });
        list.insertBefore(row, list.firstChild);
        void list.offsetWidth;
        Array.prototype.forEach.call(list.children, function (r) { r.style.transition = ""; r.style.transitionDuration = ""; });
      });
      s.wait(2400).step(0);
    }
  };

  DEMOS.einfuegen = {
    reset: function (c) {
      pcText(c, "Befund besprochen. ");
      phoneState(c, "is-busy", false);
      phoneState(c, "is-done", false);
      led(c.q("usb"), "on");
      on(c.pc, "is-air", false);
    },
    run: function (s, c) {
      s.step(1).wait(1200).step(2).tap(c.row("kontrolle"));
      s.at(function () {
        progress(c, 0, KONTROLLE.length, "„Kontrolle“ wird getippt");
        phoneState(c, "is-busy");
        on(c.pc, "is-air");
        led(c.q("usb"), "typing");
      }).step(3).wait(350);
      s.chars(KONTROLLE, 1000 / SPEED, function (sofar) {
        pcText(c, "Befund besprochen. " + sofar);
        progress(c, sofar.length, KONTROLLE.length);
      });
      s.wait(250).at(function () {
        phoneState(c, "is-done");
        on(c.pc, "is-air", false);
        led(c.q("usb"), "on");
      });
      s.wait(2400).at(function () { phoneState(c, "is-busy", false); }).wait(400).step(0);
    }
  };

  DEMOS["baustein-im-text"] = {
    reset: function (c) {
      text(c.q("text"), "Befund besprochen. ");
      text(c.q("ins"), "");
      on(c.q("ins"), "is-faded");
      text(c.q("sum"), summary(19));
      phoneState(c, "is-sheet", false);
    },
    run: function (s, c) {
      s.step(1).wait(1300).step(2).tap(c.q("pick")).at(function () { phoneState(c, "is-sheet"); });
      s.wait(1100).tap(function () { return c.row("kontrolle"); }).at(function () { phoneState(c, "is-sheet", false); });
      s.wait(380).step(3).at(function () {
        text(c.q("ins"), KONTROLLE);
        on(c.q("ins"), "is-faded", false);
        text(c.q("sum"), summary(19 + KONTROLLE.length));
      });
      s.wait(1800).at(function () { on(c.q("ins"), "is-faded"); });
      s.wait(1600).step(0);
    }
  };

  /* Felder in Bausteinen (MedType 1.3): Baustein mit leeren Feldern einfügen, ausfüllen, senden */
  var FELDER = [
    { name: "Symptome", options: ["Fieber", "Husten", "Schnupfen"] },
    { name: "Zeitraum", options: ["zwei Wochen", "vier Wochen", "drei Monaten"] }
  ];
  var FELDER_TEXT = ["Beschwerden: ", 1, ". Kontrolle in ", 2, "."];

  function slot(c, n) { return c.fig.querySelector('[data-slot="' + n + '"]'); }

  function slotState(c, n, value, active) {
    var el = slot(c, n);
    el.textContent = value || FELDER[n - 1].name;
    el.classList.toggle("is-filled", !!value);
    el.classList.toggle("is-active", !!active);
  }

  function insertTemplate(c) {
    var t = c.q("text");
    t.textContent = "";
    FELDER_TEXT.forEach(function (part) {
      if (typeof part === "string") {
        t.appendChild(document.createTextNode(part));
        return;
      }
      var el = document.createElement("span");
      el.className = "fx-slot";
      el.setAttribute("data-slot", part);
      el.textContent = FELDER[part - 1].name;
      t.appendChild(el);
    });
  }

  /* Leiste über der Tastatur: Name, „Feld n von 2“ und die Vorschläge des aktuellen Felds */
  function fieldBar(c, n, picked) {
    var f = FELDER[n - 1];
    text(c.q("fname"), f.name);
    text(c.q("fpos"), "Feld " + n + " von " + FELDER.length);
    var chips = c.q("chips");
    chips.textContent = "";
    f.options.forEach(function (option) {
      var chip = document.createElement("span");
      var em = document.createElement("em");
      em.textContent = option;
      chip.appendChild(em);
      chip.setAttribute("data-pick", option);
      if (picked.indexOf(option) >= 0) chip.className = "is-sel";
      chips.appendChild(chip);
    });
  }

  function pick(c, option) {
    return function () { return c.q("chips").querySelector('[data-pick="' + option + '"]'); };
  }

  DEMOS.felder = {
    reset: function (c) {
      text(c.q("text"), "");
      text(c.q("sum"), summary(0));
      on(c.q("field"), "is-empty");
      on(c.q("fsend"), "is-on", false);
      phoneState(c, "is-empty");
      ["is-sheet", "is-filling", "is-busy", "is-done"].forEach(function (k) { phoneState(c, k, false); });
      pcText(c, "");
      led(c.q("usb"), "on");
      on(c.pc, "is-air", false);
    },
    run: function (s, c) {
      var done = "Beschwerden: Husten, Fieber. Kontrolle in vier Wochen.";
      s.step(2).wait(1200).tap(c.q("pick")).at(function () { phoneState(c, "is-sheet"); });
      s.wait(1100).tap(function () { return c.row("beschwerden"); }).at(function () { phoneState(c, "is-sheet", false); });
      s.wait(380).at(function () {
        insertTemplate(c);
        slotState(c, 1, "", true);
        on(c.q("field"), "is-empty", false);
        phoneState(c, "is-empty", false);
        text(c.q("sum"), summary(c.q("text").textContent.length));
        fieldBar(c, 1, []);
        phoneState(c, "is-filling");
      });
      s.wait(1300).step(3).tap(pick(c, "Husten")).at(function () {
        fieldBar(c, 1, ["Husten"]);
        slotState(c, 1, "Husten", true);
      });
      s.wait(700).tap(pick(c, "Fieber")).at(function () {
        fieldBar(c, 1, ["Husten", "Fieber"]);
        slotState(c, 1, "Husten, Fieber", true);
      });
      s.wait(1000).tap(function () { return slot(c, 2); }).at(function () {
        slotState(c, 1, "Husten, Fieber", false);
        slotState(c, 2, "", true);
        fieldBar(c, 2, []);
      });
      s.wait(1000).tap(pick(c, "vier Wochen")).at(function () {
        fieldBar(c, 2, ["vier Wochen"]);
        slotState(c, 2, "vier Wochen", true);
        on(c.q("fsend"), "is-on");
        text(c.q("sum"), summary(done.length));
      });
      s.wait(1000).step(4).tap(c.q("fsend")).at(function () {
        phoneState(c, "is-filling", false);
        slotState(c, 2, "vier Wochen", false);
        progress(c, 0, done.length, "Text wird getippt");
        phoneState(c, "is-busy");
        on(c.pc, "is-air");
        led(c.q("usb"), "typing");
      }).wait(350);
      s.chars(done, 1000 / SPEED, function (sofar) {
        pcText(c, sofar);
        progress(c, sofar.length, done.length);
      });
      s.wait(250).at(function () {
        phoneState(c, "is-done");
        on(c.pc, "is-air", false);
        led(c.q("usb"), "on");
      });
      s.wait(500).at(function () {
        text(c.q("text"), "");
        text(c.q("sum"), summary(0));
        on(c.q("field"), "is-empty");
        phoneState(c, "is-empty");
      });
      s.wait(2600).at(function () { phoneState(c, "is-busy", false); }).wait(400).step(0);
    }
  };

  /* ---------- Abspielen ---------- */

  var ICONS = {
    pause: '<path d="M6.5 4v12M13.5 4v12"/>',
    play: '<path d="M6 3.8v12.4L16 10z" fill="currentColor"/>',
    again: '<path d="M3.5 10a6.5 6.5 0 1 0 2-4.7"/><path d="M3.5 3v3.5H7"/>'
  };

  function Player(fig, def) {
    this.fig = fig;
    this.def = def;
    this.c = context(fig);
    this.state = "idle";
    this.autoPaused = false;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fx-ctrl";
    var heading = fig.closest(".fx").getAttribute("aria-labelledby");
    if (heading) btn.setAttribute("aria-describedby", heading);
    fig.querySelector(".fx-stage").appendChild(btn);
    this.btn = btn;
    var self = this;
    btn.addEventListener("click", function () { self.toggle(); });
    this.frame = function (now) { self.tick(now); };
  }

  Player.prototype.label = function (icon, words) {
    this.btn.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
      ' stroke-linejoin="round" aria-hidden="true">' + ICONS[icon] + "</svg>" + words;
  };

  Player.prototype.build = function () {
    /* Reste eines früheren Durchlaufs (gedrückte Tasten, Fingertipp) entfernen */
    Array.prototype.forEach.call(this.fig.querySelectorAll(".is-down, .is-pressed, .is-tap"), function (el) {
      el.classList.remove("is-down", "is-pressed", "is-tap");
    });
    this.c.down = null;
    var s = new Script(this.c);
    this.def.reset(this.c);
    this.def.run(s, this.c);
    this.events = s.ev.sort(function (a, b) { return a.t - b.t; });
    this.end = s.t;
    this.idx = 0;
    this.clock = 0;
  };

  Player.prototype.play = function () {
    this.build();
    this.resume();
  };

  Player.prototype.resume = function () {
    this.state = "playing";
    this.autoPaused = false;
    this.last = null;
    this.fig.classList.remove("is-paused");
    this.freeze(false);
    this.label("pause", "Anhalten");
    window.cancelAnimationFrame(this.raf);
    this.raf = window.requestAnimationFrame(this.frame);
  };

  Player.prototype.pause = function (auto) {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.autoPaused = !!auto;
    window.cancelAnimationFrame(this.raf);
    this.fig.classList.add("is-paused");
    this.freeze(true);
    this.label("play", "Weiter");
  };

  /* Übergänge und Animationen der Szene anhalten bzw. fortsetzen (CSS allein hält Übergänge nicht an) */
  Player.prototype.freeze = function (stop) {
    if (!this.fig.getAnimations) return;
    this.fig.getAnimations({ subtree: true }).forEach(function (a) {
      if (stop && a.playState === "running") a.pause();
      else if (!stop && a.playState === "paused") a.play();
    });
  };

  Player.prototype.tick = function (now) {
    if (this.state !== "playing") return;
    if (this.last !== null) this.clock += Math.min(now - this.last, MAX_STEP_MS);
    this.last = now;
    while (this.idx < this.events.length && this.events[this.idx].t <= this.clock) {
      this.events[this.idx++].fn();
    }
    if (this.idx >= this.events.length && this.clock >= this.end) {
      this.state = "ended";
      this.label("again", "Noch einmal");
      return;
    }
    this.raf = window.requestAnimationFrame(this.frame);
  };

  Player.prototype.toggle = function () {
    if (this.state === "playing") this.pause(false);
    else if (this.state === "paused") this.resume();
    else this.play();
  };

  var players = [];
  Array.prototype.forEach.call(figures, function (fig) {
    var def = DEMOS[fig.getAttribute("data-demo")];
    if (!def) return;
    var p = new Player(fig, def);
    fig.classList.add("is-scripted");
    players.push(p);
    if (reduce) {
      p.state = "ended";
      p.label("play", "Vorführung abspielen");
    } else {
      p.def.reset(p.c);
      p.label("play", "Abspielen");
    }
  });

  if (reduce || !("IntersectionObserver" in window)) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var p = players.filter(function (x) { return x.fig === entry.target; })[0];
      if (!p) return;
      /* Genug zu sehen: knapp die Hälfte der Vorführung oder, bei niedrigem Fenster, mehr als die Hälfte des Fensters */
      var rb = entry.rootBounds;
      var fills = rb && entry.intersectionRect.height >= rb.height * 0.6;
      if (entry.intersectionRatio >= 0.45 || fills) {
        if (p.state === "idle") p.play();
        else if (p.state === "paused" && p.autoPaused) p.resume();
      } else if (!entry.isIntersecting) {
        p.pause(true);
      }
    });
  }, { threshold: [0, 0.2, 0.3, 0.45] });
  players.forEach(function (p) { io.observe(p.fig); });
})();
