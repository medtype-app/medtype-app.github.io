/* MedType – Wortlisten für die Suche in der Hilfe (suche.js): Füllwörter, Synonyme und Stichwörter je Stelle.
   Hier werden Wörter ergänzt, mit denen Nutzer suchen, die aber nicht im Hilfetext stehen. */
window.MedTypeSucheDaten = {
  /* zählen nicht als Suchbegriff */
  fuell: "der die das des dem den ein eine einen einem einer eines und oder aber ist sind war es er sie wie was wo wann " +
    "warum wieso weshalb welche welcher welches welchen am im in ins auf mit zu zum zur an bei von vom fur fuer ich mein meine " +
    "meinen meins meiner man mir mich kann konnen koennen kan sich wird werden hat habe haben hab bitte so da dann noch nur " +
    "auch schon mal denn doch nicht nichts kein keine geht gehen funktioniert klappt passiert macht mache tun soll sollte " +
    "muss mus gibt medtype app ab immer standig staendig oft manchmal alles wieder mehr gar einfach ohne uberhaupt " +
    "ueberhaupt irgendein irgendeine irgendwo irgendwie damit dass ganze erst einmal bevor gleich jeden jede jeder tag " +
    "wenn jetzt eigentlich trotzdem obwohl sein seine seinen dein deine unser ihr hier dort wem wer darf durfen will mochte " +
    "weil er wir mitm beim bekomme bekommen kriege the a an is my how what why not does dont as for to of on with it its can i use " +
    "using work works this that be are",
  /* allgemeine Wörter: geben Punkte, müssen aber nicht vorkommen */
  weich: "smartphone handy iphone ipad telefon pc computer rechner laptop dongle stick usbstick dongel usb",
  /* Verneinung im Suchtext: Fragen mit „nicht“, „kein“ … im Titel passen besser */
  verneinung: "nicht nichts nix kein keine keinen geht klappt funktioniert",

  /* Variante: Begriffe im Text (Leerzeichen trennt mehrere) */
  synonyme: {
    handy: "smartphone iphone", telefon: "smartphone", iphone: "smartphone", ipad: "smartphone tablet",
    stick: "dongle", usbstick: "dongle", empfanger: "dongle", adapter: "dongle", dongel: "dongle", donge: "dongle",
    pairing: "koppeln kopplung koppelmodus", pairen: "koppeln", pair: "koppeln", gekoppelt: "koppeln kopplung",
    verbinden: "verbindung verbunden koppeln", verbindet: "verbindung verbunden", verbindung: "verbunden verbinden",
    lampe: "led", licht: "led", leuchte: "led", blinken: "blinkt", leuchten: "leuchtet",
    reset: "zurucksetzen werkszustand", resetten: "zurucksetzen werkszustand", werkseinstellung: "werkszustand",
    zurucksetzen: "werkszustand", loschen: "vergessen geloscht", entfernen: "vergessen", entkoppeln: "vergessen ignorieren",
    schreibt: "getippt tippt tippen", schreiben: "tippen getippt", tippt: "getippt tippen", tipp: "tippen",
    eingabe: "tippen", text: "text", buchstaben: "zeichen", umlaute: "zeichen", sonderzeichen: "zeichen",
    falsch: "falsche vertauscht", vertauscht: "vertauscht", grossbuchstaben: "grossschreibung grossbuchstabe",
    capslock: "feststelltaste", caps: "feststelltaste", shift: "umschalttaste",
    rdp: "remote desktop", remotedesktop: "remote desktop", terminalserver: "remote citrix", vdi: "citrix remote",
    keyboard: "tastatur", tastaturlayout: "tastaturbelegung", layout: "tastaturbelegung", qwertz: "qwertz", qwerty: "tastaturbelegung",
    firmware: "dongle-software software update version", software: "dongle-software", aktualisieren: "update aktualisiert",
    updaten: "update", upgrade: "update", version: "version",
    sprache: "diktat diktieren", spracheingabe: "diktat diktieren", diktieren: "diktat", mikrofon: "diktat diktieren",
    wlan: "wlan", wifi: "wlan", internet: "internet", cloud: "server", konto: "konto", account: "konto", anmelden: "konto",
    kaufen: "beziehen anfragen", bestellen: "beziehen anfragen", preis: "preis", kosten: "preis",
    android: "android", mac: "mac", macbook: "mac", windows: "windows", laptop: "pc", computer: "pc", rechner: "pc",
    demo: "demo-modus demo-dongle", testen: "ausprobieren demo-modus", ausprobieren: "demo-modus",
    standby: "standby", schlafmodus: "standby", ruhezustand: "standby", gesperrt: "standby sperrbildschirm",
    abbruch: "verbindung verloren", getrennt: "verbindung verloren", verloren: "verloren",
    support: "kontakt support", hilfe: "kontakt", email: "kontakt e-mail", mail: "kontakt e-mail",
    datenschutz: "datenschutz daten", daten: "daten texte", sicher: "verschlusselt", verschlusselung: "verschlusselt",
    emoji: "emojis", emojis: "emojis", nix: "nichts", benutzen: "nutzen verwenden genutzt", verwenden: "nutzen", verbinde: "verbinden koppeln", installieren: "installation installiert", installation: "installiert",
    treiber: "installation installiert", bluetooth: "bluetooth",
    draufmachen: "installieren", aufspielen: "installieren", runterladen: "installieren", herunterladen: "installieren",
    punktchen: "punkte", punkte: "auslassungszeichen", drei: "3", dreimal: "3", zweimal: "2",
    ellipsis: "auslassungszeichen", quotes: "anfuhrungszeichen", reconnect: "verbindet", mitlesen: "verschlusselt",
    geschutzt: "verschlusselt", abhoren: "verschlusselt", abspeichern: "speichern bausteine", vorlagen: "bausteine",
    praxissoftware: "programm", word: "programm", kollege: "anderes", 3: "drei",
    interference: "funkstorungen", storung: "funkstorungen", funkstorung: "funkstorungen", stoerung: "funkstorungen"
  },
  /* Weitere Varianten (Umgangssprache, Englisch, Tippfehler), Form „variante:begriff/begriff“ */
  mehrSynonyme:
    "abbruche:abbruch abgebrochen:abbruch abgeschnitten:fehlen abmelden:vergessen abo:preis absatz:zeilenumbruch " +
    "account:konto adapter:dongle akkulaufzeit:akku akkuverbrauch:akku aktualisieren:update aktualisierung:update " +
    "akzent:sonderzeichen akzente:sonderzeichen anbinden:verbinden ankommt:getippt anmelden:konto anmeldung:konto " +
    "applecomputer:mac arbeitsplatz:pc auffindbar:findet ausgegeben:getippt ausgelassen:fehlen " +
    "auslieferungszustand:zurucksetzen aussetzer:abbruch batterie:akku baustein:bausteine benutzerkonto:konto " +
    "bestellen:preis bestellung:preis bildschirmschoner:standby ble:blutooth blinken:led blutoot:blutooth " +
    "blutoth:blutooth bt:blutooth button:taste caps:feststelltaste capslock:feststelltaste clipboard:einfugen " +
    "computer:pc connect:verbinden connected:verbinden connecten:verbinden copy:einfugen " +
    "datensicherheit:datenschutz demomodus:demo diktat:diktieren diode:led disconnect:abbruch docking:hub " +
    "dockingstation:hub dongel:dongle download:installation drahtlos:blutooth druckknopf:taste dsgvo:datenschutz " +
    "durcheinander:vertauscht eingabe:getippt eingabesprache:tastaturbelegung eingabetaste:zeilenumbruch " +
    "eingegeben:getippt eingeschlafen:standby eingetippt:getippt einkopieren:einfugen einloggen:konto " +
    "einrichten:installation einrichtung:installation einsprechen:diktieren emoji:emojis emoticon:emojis " +
    "emoticons:emojis empfanger:dongle energiesparen:standby energiesparmodus:standby enter:zeilenumbruch " +
    "entkoppeln:vergessen entwurf:vorschreiben entwurfe:vorschreiben erkannt:findet erkennt:findet erwerben:preis " +
    "eurozeichen:sonderzeichen factory:zurucksetzen falschherum:vertauscht fehlend:fehlen fehlende:fehlen " +
    "fehlerhaft:vertauscht fehlt:fehlen fernwartung:remote fernzugriff:remote firmware:update firmwareupdate:update " +
    "flashen:update floskeln:bausteine funk:blutooth galaxy:android gebuhr:preis gefunden:findet gepairt:koppeln " +
    "geschwindigkeit:tippgeschwindigkeit getrennt:abbruch grossgeschrieben:grossbuchstaben " +
    "grossschreiben:grossbuchstaben grossschreibtaste:feststelltaste grossschrift:grossbuchstaben handy:smartphone " +
    "herunterladen:installation hibernate:standby hid:tastatur hotspot:wlan huawei:android imac:mac " +
    "installieren:installation ipad:smartphone iphone:smartphone kabellos:blutooth kaufen:preis keyboard:tastatur " +
    "keyboardlayout:tastaturbelegung keybord:tastatur klammeraffe:sonderzeichen kleingeschrieben:grossbuchstaben " +
    "kleinschreiben:grossbuchstaben knopf:taste knopfchen:taste koppelung:koppeln kopplung:koppeln kosten:preis " +
    "kostet:preis kurzel:bausteine lampchen:led lampe:led langsam:tippgeschwindigkeit langsamer:tippgeschwindigkeit " +
    "laptop:pc laufzeit:akku layout:tastaturbelegung leuchtdiode:led leuchte:led licht:led login:konto macbook:mac " +
    "macos:mac makros:bausteine mehrfachadapter:hub mikrofon:diktieren mobiltelefon:smartphone motorola:android " +
    "mstsc:remote natel:smartphone neuzeile:zeilenumbruch newline:zeilenumbruch notebook:pc notiz:vorschreiben " +
    "notizen:vorschreiben oneplus:android osx:mac ota:update paaren:koppeln pair:koppeln pairen:koppeln " +
    "pairing:koppeln paragraf:sonderzeichen paragraph:sonderzeichen passwort:konto paste:einfugen " +
    "patientendaten:datenschutz phone:smartphone phrasen:bausteine pixel:android privacy:datenschutz " +
    "privatsphare:datenschutz probemodus:demo qwerty:tastaturbelegung rdp:remote rds:remote receiver:dongle " +
    "rechner:pc registrieren:konto registrierung:konto reinkopieren:einfugen remotedesktop:remote " +
    "reset:zurucksetzen resetten:zurucksetzen return:zeilenumbruch router:wlan rucksetzen:zurucksetzen " +
    "ruhezustand:standby samsung:android scan:findet scannen:findet schlafmodus:standby " +
    "schneller:tippgeschwindigkeit schreibt:getippt schweigepflicht:datenschutz setup:installation " +
    "shiftlock:feststelltaste shop:preis sichtbar:findet simulation:demo simulator:demo siri:diktieren " +
    "sleep:standby smartfon:smartphone smiley:emojis smileys:emojis smilies:emojis snippets:bausteine " +
    "softwareupdate:update speed:tippgeschwindigkeit splitter:hub spracheingabe:diktieren spracherkennung:diktieren " +
    "sprachsteurung:diktieren stecker:dongle stick:dongle stromverbrauch:akku sucht:findet tablet:smartphone " +
    "tastaturlayout:tastaturbelegung tastenbelegung:tastaturbelegung tastendruck:taste tastenfeld:tastatur " +
    "telefon:smartphone tempo:tippgeschwindigkeit terminalserver:remote testen:demo testmodus:demo teur:preis " +
    "textbausteine:bausteine textvorlagen:bausteine tippt:getippt treiber:installation umbruch:zeilenumbruch " +
    "umgedreht:vertauscht umlaut:sonderzeichen umschaltsperre:feststelltaste unpair:vergessen unpairen:vergessen " +
    "unterbrechung:abbruch unterbrochen:abbruch unvollstandig:fehlen upgrade:update uppercase:grossbuchstaben " +
    "usbdongle:dongle usbhub:hub usbstick:dongle vdi:remote verbindung:verbinden verbindungsabbruch:abbruch " +
    "verdreht:vertauscht verknupfen:verbinden versalien:grossbuchstaben verschlusselung:datenschutz " +
    "verschwinden:fehlen verschwindet:fehlen verteiler:hub verwechselt:vertauscht verzogert:tippgeschwindigkeit " +
    "verzogerung:tippgeschwindigkeit virtull:remote voice:diktieren vorab:vorschreiben vorbereiten:vorschreiben " +
    "vorformulieren:vorschreiben vorfuhrmodus:demo vorlage:bausteine vorlagen:bausteine " +
    "werkseinstellung:zurucksetzen werkseinstellungen:zurucksetzen werksreset:zurucksetzen wifi:wlan " +
    "windowsrechner:pc wlannetz:wlan workstation:pc xenapp:remote xiaomi:android zeilenwechsel:zeilenumbruch " +
    "zwischenablage:einfugen ",

  /* Stichwörter je Stelle (Schlüssel = Titel der Stelle); werden gesucht, aber nicht angezeigt */
  stichworte: {
    "Was ist MedType?": "funktion erklärung überblick was kann tastatur bausteine textbausteine abspeichern speichern vorlagen sätze word programm praxissoftware verschlüsselt mitlesen geschützt sicher unterschied modus modi",
    "Voraussetzungen": "voraussetzung systemvoraussetzungen kompatibel ios version iphone ipad windows qwertz benötigt brauche",
    "Erste Schritte": "einrichten einrichtung anleitung start starten verbinden anschließen koppeln installieren loslegen handy smartphone dongle stick",
    "Ohne Dongle ausprobieren": "demo demomodus testen test ausprobieren simulation bevor bestellen vorher",
    "Was die LED am Dongle zeigt": "led farben farbe bedeutung blinken leuchten lampe licht übersicht",
    "Kontakt": "support hilfe email mail anfrage kontakt problem melden wem schreiben weiterkommen weiter fragen",
    "Dongle einstecken": "einstecken anschließen usb port anstecken",
    "MedType öffnen": "bluetooth erlauben berechtigung zugriff öffnen starten verwenden darf fragt anfang",
    "Koppelmodus starten": "taste drücken halten sekunden koppelmodus pairing knopf",
    "Dongle wählen": "verbinden auswählen liste verbindungsstatus",
    "Koppeln bestätigen": "koppeln bestätigen kopplungsanfrage pairing fenster abfrage abbrechen drücken",
    "Losschreiben": "schreiben senden tippen loslegen zielfeld fenster cursor anklicken landet falsch",
    "Lässt sich ein Handy als Tastatur für den PC nutzen?": "handy tastatur nutzen smartphone",
    "Muss am PC etwas installiert werden?": "installieren installation treiber software programm adminrechte admin rechte draufmachen aufspielen büro",
    "Braucht der PC Bluetooth?": "bluetooth empfänger adapter alter computer",
    "Müssen Smartphone und PC im selben WLAN sein?": "wlan internet netzwerk offline online firewall proxy",
    "Wie gelangt Text vom Smartphone auf den PC?": "übertragen übertragung kopieren dateien fotos bilder schicken rüber praxissoftware",
    "Gibt es MedType auch für Android oder den Mac?": "android mac macos samsung linux",
    "Das Koppeln funktioniert nicht.": "koppeln kopplung pairing fehlgeschlagen fehler",
    "MedType findet den Dongle nicht.": "findet gefunden sucht erscheint liste leer taucht auf",
    "Wie lässt sich ein neues Smartphone verwenden?": "neues handy wechseln alte altes anderes smartphone iphone tauschen benutzen nutzen kollege gekoppelt zugang meins",
    "Wie lässt sich der Dongle zurücksetzen (Werkszustand)?": "zurücksetzen reset werkseinstellungen werkszustand factory löschen",
    "Lassen sich mehrere Dongles nutzen?": "mehrere zwei pcs computer arbeitsplätze umbenennen name wechseln anderer",
    "Wie wird ein Dongle aus MedType entfernt („Dongle vergessen“)?": "entfernen löschen vergessen weitergeben verkaufen abmelden entkoppeln",
    "Die App zeigt „Verbindung verloren“.": "verbindung verloren abbruch bricht abgebrochen unterbrochen getrennt reichweite störung reconnect hintergrund automatisch akku festplatte wackelt interference funkstörung weit entfernt abstand",
    "Funktioniert MedType in Remote Desktop oder Citrix?": "remote desktop rdp citrix terminalserver vdi fernzugriff",
    "Funktioniert MedType mit NIDA?": "nida nidapad pad meddv rettungsdienst rettungswagen rtw notarzt einsatzprotokoll einsatzprotokolle notfallprotokoll einsatzdokumentation dokumentation",
    "Am PC kommen falsche Zeichen an (y und z vertauscht, Sonderzeichen falsch).": "falsche zeichen tastaturbelegung layout qwertz qwerty vertauscht sonderzeichen schweiz",
    "Groß- und Kleinschreibung ist vertauscht.": "groß klein großbuchstaben großschreibung kleinschreibung schreibt feststelltaste capslock",
    "In „Live tippen“ kommt am Satzanfang kein Großbuchstabe.": "großbuchstabe satzanfang automatische großschreibung",
    "„Der Text enthält ein Zeichen, das der Dongle nicht tippen kann.“": "emoji emojis zeichen tippbar sonderzeichen auslassungszeichen punkte pünktchen ellipsis quotes anführungszeichen fehlermeldung",
    "Zeichen fehlen oder kommen doppelt.": "fehlen doppelt verschluckt tippgeschwindigkeit langsam schnell hinterher",
    "Es wird nichts getippt.": "nichts getippt tippt schreibt kommt an passiert standby demo handy smartphone",
    "Wie wird der Dongle aktualisiert?": "update aktualisieren firmware software version versionsnummer",
    "Was bedeuten die Meldungen zur Dongle-Software?": "meldung fehlermeldung update fehler",
    "Wo bleiben die Texte?": "datenschutz privacy dsgvo daten speicher speichern server cloud sicherheit gespeichert mitlesen geschützt patientendaten textbausteine bausteine backup sichern",
    "Lässt sich vom Smartphone aus am PC diktieren?": "diktat diktieren sprache spracheingabe mikrofon",
    "Wie lässt sich ein MedType-Dongle beziehen?": "kaufen bestellen preis kosten bezug erhalten",
    "LED blinkt langsam blau": "bereit",
    "LED blinkt schnell blau": "koppelmodus pairing",
    "LED leuchtet grün": "verbunden dauerhaft",
    "LED flackert grün": "tippt flackern",
    "LED blinkt 3× grün": "dreimal gekoppelt gespeichert",
    "LED kurz rot": "abgewiesen fehler",
    "LED blinkt 3× rot": "dreimal reset werkszustand",
    "LED leuchtet dauerhaft rot": "fehler startfehler kaputt",
    "LED aus": "kein licht dunkel leuchtet nicht strom",
    "„Der Dongle tippt gerade noch …“": "update startet tippen",
    "„Update wurde zurückgenommen“": "abgebrochen alte version zurück"
  },
  ledStichworte: "led blinkt leuchtet lampe dongle"
};
