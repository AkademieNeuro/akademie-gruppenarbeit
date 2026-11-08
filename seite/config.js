// Web-App-URL aus Google Apps Script (Stammtisch-Ergebnisse in Drive):
window.STAMMTISCH_API = "https://script.google.com/macros/s/AKfycbz76Ury3jXv_dxqgvD_Z3xYeeBD0pZCfrqVPSjAQcpVW7_BH5cT1zkG3SV3TVEGq1Qe/exec";

// Cluster zum Antippen, pro Stammtisch (Schlüssel = Name des Blatts in der Google-Tabelle).
// Stammtische ohne Eintrag hier laufen ohne Cluster.
window.STAMMTISCH_CLUSTER = {
  "2026-11-08 ASS 10.11. Unterstützte Kommunikation": [
    { name: "Körpereigen", beispiel: "Gestik, Mimik, Blick, Laute, Hinführen, Zeigen, Gebärden" },
    { name: "Nicht-elektronisch", beispiel: "Fotos, Symbolkarten, Kommunikationsbuch, Tafel, Bildpläne" },
    { name: "Elektronisch", beispiel: "Talker, Tablet mit App, sprechende Taste, Sprachausgabe" }
  ]
};
