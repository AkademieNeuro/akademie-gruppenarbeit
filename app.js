// Gemeinsame Helfer für Handy-Seite und Plenumsansicht
window.Board = (function () {
  const API = window.STAMMTISCH_API;
  const konfiguriert = API && API.indexOf("HIER-") !== 0;

  async function laden() {
    if (!konfiguriert) throw new Error("Die Seite ist noch nicht mit der Google-Tabelle verbunden.");
    const r = await fetch(API + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("Verbindung zur Tabelle fehlgeschlagen.");
    return r.json();
  }

  async function senden(daten) {
    if (!konfiguriert) throw new Error("Die Seite ist noch nicht mit der Google-Tabelle verbunden.");
    // text/plain vermeidet die Vorab-Anfrage, die Google Apps Script nicht beantwortet
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(daten) });
    if (!r.ok) throw new Error("Senden fehlgeschlagen.");
    return r.json();
  }

  const farbe = g => g === 0 ? "var(--ge)" : "var(--g" + (((g - 1) % 8) + 1) + ")";
  const name = g => g === 0 ? "Enno" : "Gruppe " + g;

  return { laden, senden, farbe, name, konfiguriert };
})();
