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

  // Gruppen heißen nach dem Vornamen der Gruppenleitung („Gruppe Anna“).
  // Der Name steht vorne im Text: „Gruppe Anna: Eintrag“ (so auch in der Google-Tabelle).
  // Mit Cluster: „Gruppe Anna [Körpereigen]: Eintrag“.
  const MUSTER = /^Gruppe ([^:\n\[]{1,30}?)(?: \[([^\]\n]{1,40})\])?: ([\s\S]*)$/;
  function zerlegen(e) {
    const m = MUSTER.exec(e.text || "");
    if (m) return { schluessel: m[1].toLowerCase(), name: "Gruppe " + m[1], cluster: m[2] || "", text: m[3] };
    return { schluessel: "#" + e.gruppe, name: "Gruppe " + e.gruppe, cluster: "", text: e.text };
  }
  const cluster = st => (window.STAMMTISCH_CLUSTER || {})[st] || [];
  function vorname(t) {
    t = String(t || "").replace(/[:\n\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 30);
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  }
  const farbe = i => "var(--g" + ((i % 8) + 1) + ")";

  return { laden, senden, zerlegen, cluster, vorname, farbe, konfiguriert };
})();
