/* MedType – Textseiten: Verzeichnis markiert den gerade gelesenen Abschnitt. Die Suche der Hilfe steht in suche.js. */
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
