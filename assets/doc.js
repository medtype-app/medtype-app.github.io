/* MedType – Textseiten: Verzeichnis markiert den gerade gelesenen Abschnitt; Suche in der Hilfe. Ohne Bibliotheken. */
(function () {
  "use strict";

  /* 1) Verzeichnis: letzter Abschnitt, dessen Anfang schon im oberen Drittel ist */
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  var ziele = links.map(function (a) {
    var el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    return el && { link: a, el: el.closest("section, .faq-group") || el };
  }).filter(Boolean);
  var wartet = false;
  function markiere() {
    wartet = false;
    var grenze = window.innerHeight * 0.3, aktuell = null;
    ziele.forEach(function (z) {
      if (z.el.offsetParent === null) return; /* bei der Suche ausgeblendet */
      if (z.el.getBoundingClientRect().top <= grenze) aktuell = z;
    });
    ziele.forEach(function (z) {
      if (z === aktuell) z.link.setAttribute("aria-current", "location");
      else z.link.removeAttribute("aria-current");
    });
  }
  if (ziele.length) {
    window.addEventListener("scroll", function () {
      if (!wartet) { wartet = true; window.requestAnimationFrame(markiere); }
    }, { passive: true });
    markiere();
  }

  /* 2) Suche in der Hilfe: durchsucht die Abschnitte und die häufigen Fragen */
  var box = document.getElementById("suche");
  var input = document.getElementById("suche-q");
  var status = document.getElementById("suche-status");
  if (!box || !input || !status) return;

  var MAP = { "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" };
  /* Kleinschreibung; lang: ä=ae …; kurz: ä=a … (damit „uber“ auch „über“ findet).
     map[i] = Position des Zeichens im Original */
  function norm(str, kurz) {
    var out = "", map = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charAt(i).toLowerCase();
      var r = c === "ß" ? "ss" : (!kurz && MAP[c]) || c.normalize("NFD").replace(/[̀-ͯ]/g, "");
      for (var j = 0; j < r.length; j++) { out += r.charAt(j); map.push(i); }
    }
    return { text: out, map: map };
  }
  /* Text ohne Illustrationen (aria-hidden): Beschriftungen in den Bildern sollen keine Treffer liefern */
  function lesbarerText(el) {
    var teile = [], w = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeType === 3) return NodeFilter.FILTER_ACCEPT;
        return n.getAttribute("aria-hidden") === "true" ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
      }
    });
    while (w.nextNode()) teile.push(w.currentNode.nodeValue);
    return teile.join("");
  }
  function eintrag(el, titelEl) {
    var text = lesbarerText(el);
    return {
      el: el, titelEl: titelEl, titel: titelEl ? titelEl.textContent : "",
      lang: norm(text).text, kurz: norm(text, true).text, warOffen: el.open
    };
  }
  var abschnitte = Array.prototype.slice.call(document.querySelectorAll("[data-suchbar]")).map(function (s) { return eintrag(s, null); });
  var fragen = Array.prototype.slice.call(document.querySelectorAll("#fragen details")).map(function (d) {
    return eintrag(d, d.querySelector("summary"));
  });
  var gruppen = Array.prototype.slice.call(document.querySelectorAll("#fragen .faq-group"));
  var fragenAbschnitt = document.getElementById("fragen");

  function begriffe(q) {
    return { lang: norm(q).text.split(/\s+/).filter(Boolean), kurz: norm(q, true).text.split(/\s+/).filter(Boolean) };
  }
  function passt(it, b) {
    return b.lang.every(function (t, i) { return it.lang.indexOf(t) !== -1 || it.kurz.indexOf(b.kurz[i]) !== -1; });
  }
  /* Treffer in der Frage markieren (nur Textknoten, kein HTML aus der Eingabe) */
  function setzeTitel(it, b) {
    var s = it.titelEl, t = it.titel;
    while (s.firstChild) s.removeChild(s.firstChild);
    if (!b.lang.length) { s.appendChild(document.createTextNode(t)); return; }
    var flags = [], i, k;
    for (i = 0; i < t.length; i++) flags.push(false);
    [[norm(t), b.lang], [norm(t, true), b.kurz]].forEach(function (paar) {
      var n = paar[0];
      paar[1].forEach(function (term) {
        var from = 0, at;
        while ((at = n.text.indexOf(term, from)) !== -1) {
          for (k = at; k < at + term.length; k++) flags[n.map[k]] = true;
          from = at + term.length;
        }
      });
    });
    var buf = "", an = false;
    function raus() {
      if (!buf) return;
      var node = document.createTextNode(buf);
      if (an) { var m = document.createElement("mark"); m.appendChild(node); s.appendChild(m); } else s.appendChild(node);
      buf = "";
    }
    for (i = 0; i < t.length; i++) {
      if (flags[i] !== an) { raus(); an = flags[i]; }
      buf += t.charAt(i);
    }
    raus();
  }

  function anwenden() {
    var b = begriffe(input.value), leer = !b.lang.length, n = 0, offeneFragen = [];
    document.body.classList.toggle("is-searching", !leer);
    abschnitte.forEach(function (it) {
      var ok = leer || passt(it, b);
      it.el.hidden = !ok;
      if (ok && !leer) n++;
    });
    fragen.forEach(function (it) {
      var ok = leer || passt(it, b);
      it.el.hidden = !ok;
      setzeTitel(it, ok ? b : { lang: [], kurz: [] });
      if (ok && !leer) { n++; offeneFragen.push(it); }
    });
    fragen.forEach(function (it) {
      if (leer) it.el.open = it.warOffen;
      else if (!it.el.hidden) it.el.open = offeneFragen.length <= 3;
    });
    gruppen.forEach(function (g) { g.hidden = !g.querySelector("details:not([hidden])"); });
    if (fragenAbschnitt) fragenAbschnitt.hidden = !leer && !offeneFragen.length;

    while (status.firstChild) status.removeChild(status.firstChild);
    if (leer) return;
    if (!n) {
      status.appendChild(document.createTextNode("Keine Treffer – "));
      var a = document.createElement("a");
      a.href = "mailto:support@medtype.de"; a.textContent = "support@medtype.de";
      status.appendChild(a);
    } else status.appendChild(document.createTextNode(n === 1 ? "1 Treffer" : n + " Treffer"));
  }

  fragen.forEach(function (it) {
    it.el.addEventListener("toggle", function () { if (!input.value.trim()) it.warOffen = it.el.open; });
  });
  input.addEventListener("input", anwenden);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && input.value) { input.value = ""; anwenden(); }
    if (e.key === "Enter") {
      e.preventDefault();
      var erster = document.querySelector("[data-suchbar]:not([hidden]), #fragen details:not([hidden])");
      if (erster) {
        var ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        erster.scrollIntoView({ behavior: ruhig ? "auto" : "smooth", block: "start" });
        input.blur();
      }
    }
  });
  try {
    var q = new URLSearchParams(location.search).get("q");
    if (q) input.value = q.slice(0, 100);
  } catch (e) { /* alte Browser: ohne Vorbelegung */ }
  box.hidden = false;
  if (input.value) anwenden();
})();
