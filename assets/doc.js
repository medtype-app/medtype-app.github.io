/* MedType – Textseiten: Verzeichnis markiert den gerade gelesenen Abschnitt; Sprünge innerhalb der Seite scrollen sanft.
   Die Suche der Hilfe steht in suche.js und nutzt das Scrollen hier mit (window.MedTypeScroll). */
(function () {
  "use strict";

  /* 0) Sanftes Scrollen zu Stellen derselben Seite (Themen, Verzeichnis, Treffer der Suche).
     Eigene Animation: Die Dauer wächst mit der Strecke, bleibt aber kurz genug, dass auch weite Wege natürlich
     wirken. Mit „Bewegung reduzieren“ springt die Seite sofort. Scrollt jemand selbst, endet die Animation. */
  var bewegungAus = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var KUERZESTE_MS = 320, LAENGSTE_MS = 850, ABSTAND_PX = 20;
  var bild = 0;

  function abstandOben(el) {
    var rand = parseFloat(window.getComputedStyle(el).scrollMarginTop);
    return rand > 0 ? rand : ABSTAND_PX;
  }
  function zielY(el) {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var y = el.getBoundingClientRect().top + window.pageYOffset - abstandOben(el);
    return Math.max(0, Math.min(y, max));
  }
  function weich(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function stopp() { window.cancelAnimationFrame(bild); bild = 0; }

  function scrolleZu(el, sofort) {
    stopp();
    if (sofort || bewegungAus.matches) { window.scrollTo(0, zielY(el)); return; }
    /* Start erst im ersten Bild lesen: Bis dahin kann der Browser die Seite schon selbst bewegt haben */
    var start, dauer, beginn = null;
    function schritt(jetzt) {
      if (beginn === null) {
        beginn = jetzt;
        start = window.pageYOffset;
        var weg = Math.abs(zielY(el) - start);
        if (weg < 2) { bild = 0; return; }
        dauer = Math.min(LAENGSTE_MS, Math.max(KUERZESTE_MS, 220 + Math.sqrt(weg) * 8));
      }
      var t = Math.min(1, (jetzt - beginn) / dauer);
      /* Ziel in jedem Bild neu messen: Ändert sich die Seite (aufgeklappte Frage), landet es trotzdem richtig */
      window.scrollTo(0, start + (zielY(el) - start) * weich(t));
      bild = t < 1 ? window.requestAnimationFrame(schritt) : 0;
    }
    bild = window.requestAnimationFrame(schritt);
  }
  /* Eigenes Scrollen oder Zurück/Vor beendet die Animation. Im Capture-Schritt, also vor den Handlern der Seite:
     So bricht dieselbe Eingabe (Enter im Suchfeld) nicht die Animation ab, die sie gerade erst gestartet hat. */
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (art) {
    window.addEventListener(art, function () { if (bild) stopp(); }, { passive: true, capture: true });
  });
  window.addEventListener("popstate", stopp);

  /* Fokus an die Stelle, ohne dass der Browser selbst springt (für Tastatur und Screenreader) */
  function fokussiere(el) {
    /* Bereiche (Inhalt, Abschnitt, Fragengruppe): ihre Überschrift bekommt den Fokus, kein Rahmen ums Ganze */
    if (el.matches("main, section, .faq-group, .doc-section")) el = el.querySelector("h1, h2, h3") || el;
    if (!el.matches("a[href], button, input, select, textarea, summary, [tabindex]")) {
      el.setAttribute("tabindex", "-1");
      el.addEventListener("blur", function () { el.removeAttribute("tabindex"); }, { once: true });
    }
    el.focus({ preventScroll: true });
  }

  window.MedTypeScroll = { zu: scrolleZu, fokussiere: fokussiere };

  /* Dauerhaft laufende Bilder (Erste Schritte, LED, Demo-Modus) nur im Bild animieren: spart Akku und Rechenzeit */
  if ("IntersectionObserver" in window) {
    var bilder = document.querySelectorAll(".guide-visual, .led-state, .doc-split-visual");
    var aus = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) { e.target.classList.toggle("is-off", !e.isIntersecting); });
    }, { rootMargin: "120px 0px" });
    Array.prototype.forEach.call(bilder, function (el) { aus.observe(el); });
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href^='#']");
    if (!a || a.hash.length < 2) return;
    var id;
    try { id = decodeURIComponent(a.hash.slice(1)); } catch (err) { id = a.hash.slice(1); }
    var ziel = document.getElementById(id);
    if (!ziel) return;
    e.preventDefault();
    if (ziel.tagName === "DETAILS") ziel.open = true;
    try { if (location.hash !== a.hash) history.pushState(null, "", a.hash); } catch (err) { /* ohne Verlauf */ }
    fokussiere(ziel.tagName === "DETAILS" ? ziel.querySelector("summary") || ziel : ziel);
    scrolleZu(ziel);
  });

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
})();
