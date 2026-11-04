/**
 * Stammtisch-Ergebnisboard – Akademie Neurodiversität
 * Jeder Stammtisch bekommt ein eigenes Blatt in dieser Google-Tabelle.
 *
 * EINMALIG:
 * 1. Unten bei LEITUNGSCODE einen eigenen Code eintragen (nur Enno und Cosima kennen ihn).
 * 2. Oben in der Leiste die Funktion „setup“ auswählen und auf „Ausführen“ klicken.
 * 3. „Bereitstellen“ → „Neue Bereitstellung“ → Typ „Web-App“,
 *    Ausführen als: „Ich“, Zugriff: „Jeder“ → Bereitstellen → Web-App-URL kopieren.
 */

const LEITUNGSCODE = 'HIER-EIGENEN-CODE-EINTRAGEN';

const BLATT_EINSTELLUNGEN = 'Einstellungen';
const BLATT_UEBERSICHT = 'Übersicht';
const KOPF = ['Zeitpunkt', 'Gruppe', 'Text', 'Von', 'ID', 'Gelöscht'];
const MAX_ZEICHEN = 500;

/* ---------- Einrichtung ---------- */

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const u = ss.getSheetByName(BLATT_UEBERSICHT) || ss.insertSheet(BLATT_UEBERSICHT, 0);
  if (u.getLastRow() === 0) {
    u.appendRow(['Datum', 'Titel', 'Breakout-Frage', 'Gruppen', 'Blatt']);
    u.setFrozenRows(1);
    u.getRange('1:1').setFontWeight('bold');
  }
  const s = ss.getSheetByName(BLATT_EINSTELLUNGEN) || ss.insertSheet(BLATT_EINSTELLUNGEN);
  if (s.getLastRow() === 0) {
    s.appendRow(['Einstellung', 'Wert']);
    s.getRange('1:1').setFontWeight('bold');
    neuerStammtisch_('Testlauf', 'Was nehmt ihr aus dem Austausch mit?', 4);
  }
}

/* ---------- Web-App ---------- */

function doGet() {
  return antwort_(stand_());
}

function doPost(e) {
  let daten;
  try {
    daten = JSON.parse(e.postData.contents);
  } catch (err) {
    return antwort_({ ok: false, fehler: 'Ungültige Anfrage.' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    switch (daten.aktion) {
      case 'eintragen':
        return antwort_(eintragen_(daten.gruppe, daten.text, 'Gruppe'));

      case 'pruefen':
        return antwort_({ ok: istLeitung_(daten.code) });

      case 'enno':
        if (!istLeitung_(daten.code)) return antwort_({ ok: false, fehler: 'Leitungscode stimmt nicht.' });
        return antwort_(eintragen_(daten.gruppe, daten.text, 'Enno'));

      case 'loeschen':
        if (!istLeitung_(daten.code)) return antwort_({ ok: false, fehler: 'Leitungscode stimmt nicht.' });
        return antwort_(loeschen_(daten.id));

      case 'neu':
        if (!istLeitung_(daten.code)) return antwort_({ ok: false, fehler: 'Leitungscode stimmt nicht.' });
        return antwort_(neuerStammtisch_(daten.titel, daten.frage, daten.gruppen));

      default:
        return antwort_({ ok: false, fehler: 'Unbekannte Aktion.' });
    }
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Logik ---------- */

function stand_() {
  const einst = einstellungen_();
  const blatt = aktuellesBlatt_();
  const eintraege = [];
  if (blatt && blatt.getLastRow() > 1) {
    blatt.getRange(2, 1, blatt.getLastRow() - 1, KOPF.length).getValues().forEach(z => {
      if (!z[5]) eintraege.push({ gruppe: z[1] === 'Enno' ? 0 : Number(z[1]), text: String(z[2]), von: String(z[3]), id: String(z[4]) });
    });
  }
  return {
    ok: true,
    stammtisch: String(einst.Blatt || ''),
    titel: String(einst.Titel || ''),
    frage: String(einst.Frage || ''),
    gruppen: Number(einst.Gruppen) || 4,
    eintraege: eintraege
  };
}

function eintragen_(gruppe, text, von) {
  const einst = einstellungen_();
  const blatt = aktuellesBlatt_();
  if (!blatt) return { ok: false, fehler: 'Es läuft gerade kein Stammtisch.' };
  const g = Number(gruppe);
  const max = Number(einst.Gruppen) || 4;
  if (!Number.isInteger(g) || g > max || g < (von === 'Enno' ? 0 : 1)) {
    return { ok: false, fehler: 'Diese Gruppe gibt es nicht.' };
  }
  const t = String(text || '').trim().slice(0, MAX_ZEICHEN);
  if (!t) return { ok: false, fehler: 'Bitte zuerst etwas eintippen.' };
  blatt.appendRow([new Date(), g === 0 ? 'Enno' : g, t, von, Utilities.getUuid(), '']);
  return { ok: true };
}

function loeschen_(id) {
  const blatt = aktuellesBlatt_();
  if (!blatt || blatt.getLastRow() < 2) return { ok: false, fehler: 'Eintrag nicht gefunden.' };
  const ids = blatt.getRange(2, 5, blatt.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      blatt.getRange(i + 2, 6).setValue('ja');
      return { ok: true };
    }
  }
  return { ok: false, fehler: 'Eintrag nicht gefunden.' };
}

function neuerStammtisch_(titel, frage, gruppen) {
  const ti = String(titel || '').trim().slice(0, 60) || 'Stammtisch';
  const f = String(frage || '').trim().slice(0, 200);
  const g = Math.min(8, Math.max(2, Number(gruppen) || 4));
  if (!f) return { ok: false, fehler: 'Bitte eine Breakout-Frage eintragen.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const datum = Utilities.formatDate(new Date(), 'Europe/Vienna', 'yyyy-MM-dd');
  const basis = (datum + ' ' + ti).replace(/[\[\]\*\?\/\\:']/g, ' ').slice(0, 90);
  let name = basis, n = 2;
  while (ss.getSheetByName(name)) name = basis + ' (' + (n++) + ')';

  const blatt = ss.insertSheet(name, 1);
  blatt.appendRow(KOPF);
  blatt.setFrozenRows(1);
  blatt.getRange('1:1').setFontWeight('bold');
  blatt.setColumnWidth(3, 420);

  blatt_(BLATT_UEBERSICHT).appendRow([new Date(), ti, f, g, name]);
  setzeEinstellung_('Blatt', name);
  setzeEinstellung_('Titel', ti);
  setzeEinstellung_('Frage', f);
  setzeEinstellung_('Gruppen', g);
  return { ok: true };
}

/* ---------- Hilfsfunktionen ---------- */

function istLeitung_(code) {
  return LEITUNGSCODE !== 'HIER-EIGENEN-CODE-EINTRAGEN' && String(code || '') === LEITUNGSCODE;
}

function aktuellesBlatt_() {
  const name = einstellungen_().Blatt;
  return name ? SpreadsheetApp.getActiveSpreadsheet().getSheetByName(String(name)) : null;
}

function blatt_(name) {
  const b = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!b) throw new Error('Blatt „' + name + '“ fehlt – bitte zuerst setup ausführen.');
  return b;
}

function einstellungen_() {
  const b = blatt_(BLATT_EINSTELLUNGEN);
  const o = {};
  if (b.getLastRow() > 1) {
    b.getRange(2, 1, b.getLastRow() - 1, 2).getValues().forEach(z => { o[z[0]] = z[1]; });
  }
  return o;
}

function setzeEinstellung_(name, wert) {
  const b = blatt_(BLATT_EINSTELLUNGEN);
  if (b.getLastRow() > 1) {
    const namen = b.getRange(2, 1, b.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < namen.length; i++) {
      if (namen[i][0] === name) { b.getRange(i + 2, 2).setValue(wert); return; }
    }
  }
  b.appendRow([name, wert]);
}

function antwort_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
