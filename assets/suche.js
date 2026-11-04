/* MedType – Suche in der Hilfe. Findet einzelne Stellen (häufige Fragen, Schritte, LED-Zustände, Meldungen,
   Abschnitte) und zeigt sie als Trefferliste mit Ausschnitt unter dem Suchfeld. Ein Treffer springt zur Stelle
   und klappt die Frage auf. Wortlisten (Synonyme, Stichwörter) stehen in suche-daten.js.
   Ohne Bibliotheken; Eingaben werden nur als Text eingesetzt, nie als HTML. */
(function () {
  "use strict";

  var box = document.getElementById("suche");
  var input = document.getElementById("suche-q");
  var status = document.getElementById("suche-status");
  var liste = document.getElementById("suche-ergebnisse");
  var DATEN = window.MedTypeSucheDaten;
  if (!box || !input || !status || !liste || !DATEN) return;

  var ERSTE_TREFFER = 6;
  var AUSSCHNITT = 170;
  var MAX_ZEICHEN = 100;
  var MAX_BEGRIFFE = 8;
  var STATUS_PAUSE_MS = 450;
  var SYNONYM_FAKTOR = 0.6;
  var MELDUNG_ABZUG = 12;
  var bewegungAus = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var grobZeiger = window.matchMedia ? window.matchMedia("(pointer: coarse)") : { matches: false };

  /* ---------- Text vereinheitlichen ---------- */

  var ERSATZ = {
    "ä": "a", "ö": "o", "ü": "u", "ß": "ss", "–": "-", "—": "-",
    /* Zeichen, nach denen gesucht wird, als Wort („3×“ = „3 x“, „€“ = „euro“). „…“ und „µ“ als interne Wörter,
       die kein normales Suchwort trifft („drei“ fände sonst „…“, „Mikrofon“ fände „µ“). */
    "×": " x ", "€": " euro ", "@": " at ", "§": " paragraf ", "…": " zzellipsezz ", "µ": " zzmyzz ", "°": " grad "
  };
  /* Kleinschreibung, ohne Akzente; ä = ae = a usw., damit „uber“, „ueber“ und „über“ gleich sind.
     map[k] = Position des k-ten Zeichens im Original (für Ausschnitte und Markierungen). */
  function falte(str) {
    var out = "", map = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charAt(i).toLowerCase();
      var r = ERSATZ[c];
      if (r === undefined) r = c.normalize ? c.normalize("NFD").replace(/[̀-ͯ]/g, "") : c;
      if (r === "e" && /[aou]$/.test(out) && !ERSATZ[str.charAt(i - 1).toLowerCase()]) continue;
      for (var j = 0; j < r.length; j++) { out += r.charAt(j); map.push(i); }
    }
    return { text: out, map: map };
  }

  /* Lesbare Kennung für Anker (ä → ae, ohne das Weglassen von „e“) */
  function kurzname(str) {
    return str.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/×/g, "x").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").slice(0, 48).replace(/^-+|-+$/g, "");
  }

  function woerter(text) {
    var ergebnis = [], re = /[a-z0-9]+/g, m;
    while ((m = re.exec(text))) ergebnis.push({ w: m[0], a: m.index, e: m.index + m[0].length });
    return ergebnis;
  }

  function menge(text) {
    var m = {};
    text.split(/\s+/).forEach(function (w) { if (w) m[falte(w).text] = true; });
    return m;
  }
  var FUELL = menge(DATEN.fuell);
  var WEICH = menge(DATEN.weich);
  var VERNEINUNG = menge(DATEN.verneinung);

  /* Synonyme: Variante → Begriffe im Text; auch rückwärts, damit „update“ „aktualisiert“ findet */
  var SYN = {};
  function schluessel(w) { return falte(w).text.replace(/[^a-z0-9]/g, ""); }
  function verknuepfe(a, b) {
    if (a === b || !a || !b) return;
    SYN[a] = SYN[a] || [];
    if (SYN[a].indexOf(b) === -1) SYN[a].push(b);
  }
  Object.keys(DATEN.synonyme).forEach(function (k) {
    DATEN.synonyme[k].split(" ").forEach(function (z) { verknuepfe(schluessel(k), schluessel(z)); });
  });
  DATEN.mehrSynonyme.trim().split(/\s+/).forEach(function (eintrag) {
    var teile = eintrag.split(":");
    teile[1].split("/").forEach(function (z) { verknuepfe(teile[0], z); });
  });
  /* Rückwärts nur mit längeren Wörtern: kurze Varianten („ble“, „funk“) träfen sonst „bleibt“, „Funktion“ */
  Object.keys(SYN).forEach(function (k) {
    SYN[k].slice().forEach(function (z) { if (k.length >= 5 && z.length >= 3) verknuepfe(z, k); });
  });

  /* ---------- Fundstellen sammeln ---------- */

  /* Text ohne Illustrationen (aria-hidden) und ohne die angegebenen Teile */
  function lesbarerText(el, ohne) {
    var teile = [], w = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeType === 3) return NodeFilter.FILTER_ACCEPT;
        if (n.getAttribute("aria-hidden") === "true" || (ohne && ohne.indexOf(n) !== -1)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_SKIP;
      }
    });
    while (w.nextNode()) teile.push(w.currentNode.nodeValue);
    return teile.join("").replace(/\s+/g, " ").trim();
  }

  /* Feld mit vereinheitlichtem Text, Wörtern und Wortpaaren („Demo-Modus“ auch als „demomodus“) */
  function feld(text) {
    var f = falte(text), w = woerter(f.text), paare = [];
    for (var i = 0; i + 1 < w.length; i++) {
      if (f.text.slice(w[i].e, w[i + 1].a).length <= 1) {
        paare.push({ w: w[i].w + w[i + 1].w, a: w[i].a, e: w[i + 1].e, paar: true });
      }
    }
    return { roh: text, text: f.text, map: f.map, woerter: w.concat(paare) };
  }

  var stellen = [], vergeben = {};
  function kennung(praefix, titel) {
    var rest = kurzname(titel);
    if (rest.indexOf(praefix + "-") === 0) rest = rest.slice(praefix.length + 1); /* „led-led-…“ vermeiden */
    var basis = praefix + "-" + rest, id = basis, n = 2;
    while (vergeben[id] || document.getElementById(id)) id = basis + "-" + n++;
    vergeben[id] = true;
    return id;
  }
  function stelle(art, titel, text, el, opt) {
    opt = opt || {};
    if (!el.id) el.id = kennung(opt.praefix || "stelle", titel);
    el.setAttribute("data-treffer", "");
    stellen.push({
      art: art, artFeld: feld(art), titel: feld(titel), text: feld(text || ""), el: el,
      stich: feld([opt.stich || "", DATEN.stichworte[titel] || ""].join(" ")),
      anker: opt.anker || el.id, fokus: opt.fokus || null, details: opt.details || null, rang: stellen.length
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll(".doc-main > section"), function (sec) {
    var h2 = sec.querySelector("h2");
    if (!h2) return;
    var unter = [h2].concat(Array.prototype.slice.call(sec.querySelectorAll("ol.guide, .table-wrap, .faq-group")));
    if (sec.id !== "fragen") stelle("Abschnitt", lesbarerText(h2), lesbarerText(sec, unter), sec, { anker: h2.id, fokus: h2 });

    Array.prototype.forEach.call(sec.querySelectorAll("ol.guide > li"), function (li, i) {
      var titelEl = li.querySelector(".guide-text strong");
      var titel = titelEl ? lesbarerText(titelEl).replace(/\.$/, "") : "Schritt " + (i + 1);
      stelle("Erste Schritte · Schritt " + (i + 1), titel, lesbarerText(li.querySelector(".guide-text") || li, [titelEl]), li,
        { praefix: "schritt-" + (i + 1) });
    });
    if (sec.querySelector(".led-state")) {
      Array.prototype.forEach.call(sec.querySelectorAll("tbody tr"), function (tr) {
        var zellen = tr.querySelectorAll("td");
        stelle("LED am Dongle", "LED " + lesbarerText(zellen[0]), lesbarerText(zellen[1]), tr,
          { praefix: "led", stich: DATEN.ledStichworte });
      });
    }
  });

  Array.prototype.forEach.call(document.querySelectorAll("#fragen details"), function (d) {
    var summary = d.querySelector("summary");
    var gruppe = d.closest(".faq-group");
    var h3 = gruppe && gruppe.querySelector("h3");
    var inhalt = d.querySelector("summary + div") || d;
    var tabelle = inhalt.querySelector("table");
    stelle("Häufige Frage" + (h3 ? " · " + lesbarerText(h3) : ""), lesbarerText(summary),
      lesbarerText(inhalt, tabelle ? [tabelle] : null), d, { praefix: "frage", details: d, fokus: summary });
    if (tabelle) {
      Array.prototype.forEach.call(tabelle.querySelectorAll("tbody tr"), function (tr) {
        var zellen = tr.querySelectorAll("td");
        stelle("Meldung zur Dongle-Software", lesbarerText(zellen[0]), lesbarerText(zellen[1]), tr,
          { praefix: "meldung", details: d });
      });
    }
  });

  /* ---------- Vergleichen und bewerten ---------- */

  /* Abstand mit Vertauschung (Damerau, eingeschränkt), bricht ab, sobald er größer als grenze ist */
  function abstand(a, b, grenze) {
    if (Math.abs(a.length - b.length) > grenze) return grenze + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) { d[0][j] = j; }
    for (i = 1; i <= a.length; i++) {
      var min = Infinity;
      for (j = 1; j <= b.length; j++) {
        var k = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + k);
        if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
        if (d[i][j] < min) min = d[i][j];
      }
      if (min > grenze) return grenze + 1;
    }
    return d[a.length][b.length];
  }

  function gemeinsamerAnfang(a, b) {
    var n = 0;
    while (n < a.length && n < b.length && a.charAt(n) === b.charAt(n)) n++;
    return n;
  }

  /* Wie gut passt Begriff t zu Wort w? 0 = gar nicht. Synonyme nur ganz oder als Wortanfang. */
  function passt(t, w, synonym) {
    if (t === w) return 10;
    if (t.length >= (synonym ? 4 : 3) && w.indexOf(t) === 0) return 7;
    if (synonym) return 0;
    var anfang = gemeinsamerAnfang(t, w);
    if (anfang >= 4 && anfang >= Math.min(t.length, w.length) - 3) return 5;
    /* Wortende („modus“ in „Koppelmodus“) oder Wort vorn im Begriff („demo“ in „demomodus“) */
    if (t.length >= 4 && w.length > t.length && w.slice(-t.length) === t) return 5;
    if (w.length >= 4 && t.indexOf(w) === 0) return 5;
    if (t.length >= 5) {
      var grenze = t.length >= 8 ? 2 : 1;
      if (abstand(t, w, grenze) <= grenze) return 4;
    }
    return 0;
  }

  /* Bester Treffer eines Begriffs (mit Varianten) in einem Feld; liefert Wert und getroffene Wörter */
  function suche(varianten, f) {
    var best = 0, getroffen = [];
    f.woerter.forEach(function (w) {
      var wert = 0;
      varianten.forEach(function (v, i) {
        if (w.paar && v.length < w.w.length - 1) return;
        var p = passt(v, w.w, i > 0);
        if (w.paar && p !== 10 && p !== 4) return; /* Wortpaare nur ganz gleich oder vertippt */
        if (i > 0) p *= SYNONYM_FAKTOR; /* Synonym schwächer als das getippte Wort */
        if (p > wert) wert = p;
      });
      if (wert > 0) getroffen.push(w);
      if (wert > best) best = wert;
    });
    return { wert: best, stellen: getroffen };
  }

  function begriffe(q) {
    var alle = woerter(falte(q).text).map(function (w) { return w.w; });
    var wichtig = alle.filter(function (w) { return !FUELL[w]; });
    if (!wichtig.length) wichtig = alle.filter(function (w) { return !VERNEINUNG[w]; });
    var liste = [], gesehen = {};
    wichtig.forEach(function (w) {
      if (gesehen[w] || liste.length >= MAX_BEGRIFFE) return;
      gesehen[w] = true;
      var varianten = [w].concat(SYN[w] || []);
      if (w.length > 4 && /s$/.test(w)) varianten.push(w.slice(0, -1));
      /* einzelne Buchstaben („x“ aus „1×“, „y“) und allgemeine Wörter geben Punkte, sind aber keine Pflicht */
      liste.push({ varianten: varianten, weich: !!WEICH[w] || w.length === 1 });
    });
    if (liste.every(function (t) { return t.weich; })) liste.forEach(function (t) { t.weich = false; });
    return {
      liste: liste,
      pflicht: liste.filter(function (t) { return !t.weich; }).length,
      verneint: alle.some(function (w) { return VERNEINUNG[w]; }),
      ganz: alle.join(" ")
    };
  }

  /* Rohwerte je Begriff: Titel zählt dreifach, Stichwörter zweieinhalbfach, Text einfach */
  function bewerte(s, b) {
    var werte = [], marken = { titel: [], text: [] };
    b.liste.forEach(function (begriff) {
      var v = begriff.varianten;
      var t = suche(v, s.titel), x = suche(v, s.text), a = suche(v, s.artFeld), k = suche(v, s.stich);
      werte.push(Math.max(t.wert * 3, k.wert * 2.5, x.wert, a.wert * 1.2));
      marken.titel = marken.titel.concat(t.stellen);
      marken.text = marken.text.concat(x.stellen);
    });
    var bonus = 0;
    if (b.liste.length > 1 || b.ganz.length > 5) {
      if (s.titel.text.indexOf(b.ganz) !== -1) bonus += 30;
      else if (s.text.text.indexOf(b.ganz) !== -1) bonus += 12;
    }
    if (b.verneint && /\b(nicht|nichts|kein|keine|fehlen|falsch|verloren|aus)\b/.test(s.titel.text)) bonus += 8;
    if (s.art === "Abschnitt") bonus -= 4;
    else if (s.art.indexOf("Meldung") === 0) bonus -= MELDUNG_ABZUG;
    else bonus += 1;
    return { stelle: s, werte: werte, bonus: bonus, marken: marken };
  }

  /* Seltene Wörter zählen mehr als häufige (Gewicht nach Zahl der Stellen, die sie enthalten).
     Kurze Anfragen: Alle wichtigen Wörter müssen vorkommen. Lange Fragen: genug vom Gewicht muss vorkommen. */
  function finde(q) {
    var b = begriffe(q);
    if (!b.liste.length) return { b: b, treffer: [], aehnlich: false };
    var bewertet = stellen.map(function (s) { return bewerte(s, b); });
    var n = stellen.length, pflichtGewicht = 0, unbekannt = 0;
    b.liste.forEach(function (t, j) {
      var df = bewertet.filter(function (r) { return r.werte[j] > 0; }).length;
      t.gewicht = Math.log(1 + n / Math.max(1, df));
      /* Wörter, die nirgends vorkommen, können nicht helfen: nicht verlangen */
      if (!df && !t.weich) { t.weich = true; unbekannt++; }
      if (!t.weich) pflichtGewicht += t.gewicht;
    });
    var pflicht = b.pflicht - unbekannt;
    bewertet.forEach(function (r) {
      var summe = r.bonus, gedeckt = 0, alle = true;
      b.liste.forEach(function (t, j) {
        summe += r.werte[j] * t.gewicht * (t.weich ? 0.5 : 1);
        if (!t.weich) {
          if (r.werte[j] > 0) gedeckt += t.gewicht;
          else alle = false;
        }
      });
      r.alle = alle;
      r.etwas = r.werte.some(function (v) { return v > 0; }); /* mindestens ein Suchwort kommt vor */
      r.abdeckung = pflichtGewicht ? gedeckt / pflichtGewicht : 1;
      r.wert = summe * (0.3 + 0.7 * r.abdeckung);
    });
    var lang = pflicht >= 4;
    var treffer = bewertet.filter(function (r) {
      return r.etwas && r.wert > 0 && (lang ? r.abdeckung >= 0.45 : r.alle);
    });
    var aehnlich = unbekannt > 0 && treffer.length > 0;
    if (!treffer.length && pflicht > 1) {
      treffer = bewertet.filter(function (r) { return r.etwas && r.wert > 0 && r.abdeckung >= 0.3; });
      aehnlich = treffer.length > 0;
    }
    treffer.sort(function (x, y) { return y.wert - x.wert || x.stelle.rang - y.stelle.rang; });
    return { b: b, treffer: treffer, aehnlich: aehnlich };
  }

  /* ---------- Anzeige ---------- */

  /* Markierte Bereiche im Original: bis zum Wortende verlängert, überlappende zusammengelegt */
  function bereiche(f, worte, von, bis) {
    var liste = worte.map(function (w) {
      var a = f.map[w.a], e = f.map[w.e - 1] + 1, buchstabe = /[0-9A-Za-zÀ-ÖØ-öø-ÿ]/;
      if (buchstabe.test(f.roh.charAt(e - 1))) { while (e < f.roh.length && buchstabe.test(f.roh.charAt(e))) e++; }
      return [a, e];
    }).filter(function (m) { return m[1] > von && m[0] < bis; })
      .sort(function (x, y) { return x[0] - y[0]; });
    var zusammen = [];
    liste.forEach(function (m) {
      var letzter = zusammen[zusammen.length - 1];
      if (letzter && m[0] <= letzter[1]) letzter[1] = Math.max(letzter[1], m[1]);
      else zusammen.push([m[0], m[1]]);
    });
    return zusammen;
  }

  /* Text mit markierten Stellen (nur Textknoten, kein HTML aus der Eingabe) */
  function markiert(f, worte, von, bis, ziel) {
    var pos = von;
    bereiche(f, worte, von, bis).forEach(function (m) {
      var a = Math.max(m[0], pos), e = Math.min(m[1], bis);
      if (e <= a) return;
      if (a > pos) ziel.appendChild(document.createTextNode(f.roh.slice(pos, a)));
      var mark = document.createElement("mark");
      mark.textContent = f.roh.slice(a, e);
      ziel.appendChild(mark);
      pos = e;
    });
    if (pos < bis) ziel.appendChild(document.createTextNode(f.roh.slice(pos, bis)));
  }

  function ausschnitt(f, worte, ziel) {
    var roh = f.roh;
    if (!roh) return false;
    var von = 0;
    if (worte.length) {
      var erstes = worte.reduce(function (m, w) { return w.a < m.a ? w : m; });
      var start = f.map[erstes.a];
      von = Math.max(0, start - 55);
      if (von > 0) { var leer = roh.indexOf(" ", von); von = leer === -1 || leer > start ? von : leer + 1; }
    }
    var bis = Math.min(roh.length, von + AUSSCHNITT);
    if (bis < roh.length) { var ende = roh.lastIndexOf(" ", bis); if (ende > von + 40) bis = ende; }
    if (von > 0) ziel.appendChild(document.createTextNode("… "));
    markiert(f, worte, von, bis, ziel);
    if (bis < roh.length) ziel.appendChild(document.createTextNode(" …"));
    return true;
  }

  var laufendeNummer = 0;
  function eintrag(r) {
    var s = r.stelle, nr = ++laufendeNummer;
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.className = "search-hit";
    a.href = "#" + s.anker;
    var art = document.createElement("span");
    art.className = "search-kind";
    art.id = "treffer-art-" + nr;
    art.textContent = s.art;
    var titel = document.createElement("span");
    titel.className = "search-title";
    titel.id = "treffer-titel-" + nr;
    markiert(s.titel, r.marken.titel, 0, s.titel.roh.length, titel);
    a.appendChild(art);
    a.appendChild(titel);
    var text = document.createElement("span");
    text.className = "search-snippet";
    text.id = "treffer-text-" + nr;
    var mitText = ausschnitt(s.text, r.marken.text, text);
    if (mitText) a.appendChild(text);
    /* Vorgelesen wird der Titel als Name, Art und Ausschnitt als Beschreibung */
    a.setAttribute("aria-labelledby", titel.id);
    a.setAttribute("aria-describedby", art.id + (mitText ? " " + text.id : ""));
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; /* neuer Tab bleibt möglich */
      e.preventDefault();
      zeige(s);
    });
    li.appendChild(a);
    return li;
  }

  function leere(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  /* Statuszeile erst nach einer kurzen Tipp-Pause schreiben, damit Screenreader nicht jeden Buchstaben ansagen */
  var statusZeit = 0, statusText = "";
  function setzeStatus(teile) {
    var neu = teile.map(function (t) { return typeof t === "string" ? t : t.text; }).join("");
    window.clearTimeout(statusZeit);
    if (neu === statusText) return;
    /* Alte Zahl sofort weg, damit sie nicht neben neuen Treffern steht; die neue nach der Tipp-Pause */
    leere(status);
    statusText = "";
    if (!neu) return;
    statusZeit = window.setTimeout(function () {
      statusText = neu;
      teile.forEach(function (t) {
        if (typeof t === "string") { status.appendChild(document.createTextNode(t)); return; }
        var link = document.createElement("a");
        link.href = t.href;
        link.textContent = t.text;
        status.appendChild(link);
      });
    }, STATUS_PAUSE_MS);
  }

  var letzte = null;
  function anwenden(alleZeigen) {
    var q = input.value.trim().slice(0, MAX_ZEICHEN);
    leere(liste);
    document.body.classList.toggle("is-searching", !!q);
    merkeAnfrage(q);
    if (!q) { liste.hidden = true; letzte = null; setzeStatus([]); return; }

    var ergebnis = finde(q);
    letzte = ergebnis;
    var n = ergebnis.treffer.length;
    if (!n) {
      liste.hidden = true;
      /* Bei ein, zwei Buchstaben wird noch getippt: dann noch keine Meldung */
      setzeStatus(q.length < 3 ? [] : ["Keine Treffer für „" + q + "“. Andere Wörter versuchen oder an ",
        { href: "mailto:support@medtype.de", text: "support@medtype.de" }, " schreiben."]);
      return;
    }
    setzeStatus([ergebnis.aehnlich
      ? "Keine Stelle enthält alle Wörter. Am nächsten kommen:"
      : (n === 1 ? "1 Treffer" : n + " Treffer") + " für „" + q + "“"]);
    var zeigen = alleZeigen ? n : Math.min(n, ERSTE_TREFFER);
    ergebnis.treffer.slice(0, zeigen).forEach(function (r) { liste.appendChild(eintrag(r)); });
    if (zeigen < n) {
      var li = document.createElement("li");
      var mehr = document.createElement("button");
      mehr.type = "button";
      mehr.className = "search-more";
      mehr.textContent = "Alle " + n + " Treffer zeigen";
      mehr.addEventListener("click", function () {
        anwenden(true);
        var l = liste.querySelectorAll(".search-hit");
        if (l[zeigen]) l[zeigen].focus();
      });
      li.appendChild(mehr);
      liste.appendChild(li);
    }
    liste.hidden = false;
  }

  /* Springt zur Stelle, klappt die Frage auf und hebt die Stelle kurz hervor */
  function zeige(s, ohneFokus, sofort) {
    window.clearTimeout(statusZeit); /* keine Ansage mehr, wenn die Suche schon verlassen ist */
    if (s.details && !s.details.open) s.details.open = true;
    var el = s.el;
    el.classList.remove("is-hit");
    void el.offsetWidth;
    el.classList.add("is-hit");
    window.setTimeout(function () { el.classList.remove("is-hit"); }, 2600);
    /* Erst Fokus, dann Scrollen: Ein späterer Fokus bricht sanftes Scrollen ab. */
    if (!ohneFokus) {
      var fokus = s.fokus || el;
      if (!fokus.matches("a, button, summary, input")) {
        fokus.setAttribute("tabindex", "-1");
        fokus.addEventListener("blur", function () { fokus.removeAttribute("tabindex"); }, { once: true });
      }
      fokus.focus({ preventScroll: true });
    }
    /* Sanft wie die übrigen Sprünge der Seite (doc.js); ohne doc.js direkt */
    if (window.MedTypeScroll) window.MedTypeScroll.zu(el, sofort);
    else el.scrollIntoView({ block: "start" });
    try { history.replaceState(null, "", location.pathname + location.search + "#" + s.anker); } catch (e) { /* ohne Verlauf */ }
  }

  var gemerkt = null;
  function merkeAnfrage(q) {
    if (q === gemerkt) return;
    gemerkt = q;
    try {
      var p = new URLSearchParams(location.search);
      if (q) p.set("q", q); else p.delete("q");
      var such = p.toString();
      history.replaceState(null, "", location.pathname + (such ? "?" + such : "") + location.hash);
    } catch (e) { /* alte Browser: Adresse bleibt */ }
  }

  /* ---------- Bedienung ---------- */

  function links() { return Array.prototype.slice.call(liste.querySelectorAll(".search-hit, .search-more")); }

  input.addEventListener("input", function () { anwenden(false); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && input.value) { input.value = ""; anwenden(false); }
    else if (e.key === "ArrowDown" && !liste.hidden) { e.preventDefault(); var l = links(); if (l[0]) l[0].focus(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (!letzte || !letzte.treffer.length) return;
      /* Am Handy schließt „Suchen“ nur die Tastatur, damit die Liste zu sehen ist; sonst zum ersten Treffer */
      if (grobZeiger.matches && letzte.treffer.length > 1) {
        input.blur();
        liste.scrollIntoView({ behavior: bewegungAus.matches ? "auto" : "smooth", block: "nearest" });
      } else {
        input.blur();
        zeige(letzte.treffer[0].stelle);
      }
    }
  });
  liste.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Escape") return;
    e.preventDefault();
    if (e.key === "Escape") { input.focus(); return; }
    var l = links(), i = l.indexOf(document.activeElement);
    if (e.key === "ArrowDown" && i < l.length - 1) l[i + 1].focus();
    else if (e.key === "ArrowUp") (i > 0 ? l[i - 1] : input).focus();
  });

  /* Direkter Link auf eine Stelle (#frage-…, #led-…): Frage aufklappen und hinspringen, auch innerhalb der Seite */
  function folgeAnker(e) {
    var roh = location.hash.slice(1), ziel;
    if (!roh) return;
    try { ziel = decodeURIComponent(roh); } catch (e) { ziel = roh; }
    /* Beim Laden direkt hin (ohne Animation von oben), bei Änderung der Adresse sanft */
    stellen.forEach(function (s) { if (s.el.id === ziel && s.details) zeige(s, true, !e); });
  }
  window.addEventListener("hashchange", folgeAnker);

  try {
    var vorgabe = new URLSearchParams(location.search).get("q");
    if (vorgabe) input.value = vorgabe.slice(0, MAX_ZEICHEN);
  } catch (e) { /* alte Browser: ohne Vorbelegung */ }
  box.hidden = false;
  if (input.value) anwenden(false);
  folgeAnker();
})();
