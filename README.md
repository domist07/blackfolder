# 🎵 LJC Namensschild Generator

> Erstelle personalisierte Namensschilder für den Landesjugendchor – direkt im Browser, als druckfertiges Vektor-PDF.

## ✨ Features


- **Live-Vorschau** – Echtzeit-Rendering während der Eingabe
- **Hybrid-PDF-Export** – Hintergrund als gerendertes Bild (Logo mit Bezier-Pfaden), Text als echter Vektor (scharf, durchsuchbar & kopierbar)
- **Automatische Schriftanpassung** – Text wird dynamisch verkleinert, wenn er zu breit wird
- **Offline-fähig** – Eingaben werden im LocalStorage gespeichert
- **Zwei Export-Modi** – Einzelnes Namensschild oder A4-Druckvorlage mit Schnittmarkierungen
- **Lokale Schriftart** – Roboto wird lokal aus dem `fonts/` Verzeichnis geladen

## 📐 Design-Spezifikationen

| Eigenschaft      | Wert                          |
|------------------|-------------------------------|
| Format           | 95 × 60 mm (Querformat)       |
| Hintergrund      | LJC-Rot `#9d0000`             |
| Schriftfarbe     | Weiß `#FFFFFF`                |
| Schriftart       | Roboto                        |
| Vor-/Nachname    | 36pt, fett, max. 65 mm breit  |
| Kontaktdaten     | 14pt, normal, max. 50 mm breit|
| Min. Schriftgröße| 8pt                           |

## 🎨 Design Philosophy

### 1. Single Source of Truth

Der Hintergrund (Logo, Streifen, rote Fläche) wird **einmal** in `backgroundRenderer.js` definiert und sowohl für die Canvas-Vorschau als auch für den PDF-Export verwendet. Keine doppelte Pflege, keine Abweichungen.

```
backgroundRenderer.js
        │
        ├──→ Canvas-Vorschau (Live, direkte Zeichnung)
        │
        └──→ PDF-Export (Canvas → PNG → PDF als Bild-Layer)
```

### 2. Hybrid-Rendering im PDF

| Layer       | Technik                       | Warum                              |
|-------------|-------------------------------|------------------------------------|
| Hintergrund | Canvas → PNG (gecacht)        | Komplexe Bezier-Pfade des Logos    |
| Text        | jsPDF `.text()` Vektor-API    | Scharf, durchsuchbar, editierbar   |

→ Bester Kompromiss zwischen visueller Treue und Textqualität.

### 3. Responsive Typography

Alle Textfelder passen sich automatisch an:

```
Eingabe: "Maximilian-Alexander"
            │
            ▼
measureText() → zu breit?
            │
            ├── Nein → Standardgröße verwenden
            │
            └── Ja → Größe in 0.5pt-Schritten reduzieren
                    (bis min. 8pt)
```

Vor- und Nachname teilen sich immer dieselbe Schriftgröße – der längere Name bestimmt die Größe für beide.

### 4. CSS-Variablen für Theming

Alle Farben sind als CSS Custom Properties definiert.

```js
--primary-color: #9d0000;
--primary-light: #b13333;
--primary-dark: #7a0000;
--text-dark: #1a1a1a;
--text-light: #ffffff;
--bg-color: #f5f5f5;
--card-bg: #ffffff;
```

### 5. Performance-First Export


- Fonts werden beim App-Start im Hintergrund vorgeladen (`preloadFonts()` in `useEffect`)
- Der gerenderte Hintergrund wird nach dem ersten Export als PNG gecacht (Canvas → PNG → PDF)

- Erster Export: ~80ms – Zweiter Export: ~15ms (Cache-Hit für Hintergrundbild)

### 6. Schriftart Einrichtung

Der Generator nutzt die Schriftart **Roboto** für die Namensschilder. Die Schriftart wird lokal aus dem `fonts/` Verzeichnis geladen.

**Installation der Schriftart:**
1. **Roboto von Google Fonts herunterladen**:
   - Besuche [https://fonts.google.com/specimen/Roboto](https://fonts.google.com/specimen/Roboto)
   - Klicke auf den Download-Button oder lade die Schriftart manuell herunter

2. **Font-Dateien im Projekt platzieren**:
   Erstelle im Projektverzeichnis einen `fonts/` Ordner (auf gleicher Ebene wie `src/`) und füge folgende Dateien hinzu:
   ```
   fonts/
   ├── Roboto-Regular.ttf
   └── Roboto-Medium.ttf
   ```
   
   Hinweis: Ohne die Font-Dateien funktioniert die Vorschau im Browser, der PDF-Export nutzt dann einen Fallback.

## 🛠️ Tech Stack

| Technologie                                                        | Zweck                          |
|--------------------------------------------------------------------|--------------------------------|
| [React 18](https://react.dev)                                      | UI-Komponenten & State         |
| [Vite 5](https://vitejs.dev)                                       | Build-Tool & Dev-Server        |
| [jsPDF](https://github.com/parallax/jsPDF)                         | PDF-Generierung                |
| [Google Fonts – Roboto](https://fonts.google.com/specimen/Roboto)  | Schriftart in der Vorschau     |
| Canvas 2D API                                                      | Live-Vorschau & Text-Messung   |

---

## 📦 Installation

### Voraussetzungen

- [Node.js](https://nodejs.org/) ≥ 18.x
- npm ≥ 9.x

### Schritte

**1. Repository klonen**

```bash
git clone https://github.com/domist07/blackfolder.git
cd blackfolder
```

**2. Dependencies installieren**

```bash
npm install
```

**3. Entwicklungsserver starten**

```bash
npm run dev
```

Der Browser öffnet automatisch `http://localhost:3000`.

### Produktion

Optimiertes Build erstellen:

```bash
npm run build
```

Build lokal testen:

```bash
npm run preview
```

Das Ergebnis liegt in `dist/` und kann auf jedem statischen Hosting deployed werden
(Netlify, Vercel, GitHub Pages).

## 📂 Projektstruktur

```
ljc-namensschild-generator/
├── index.html                        Einstiegspunkt + Google Fonts Link
├── package.json
├── vite.config.js
├── fonts/                            Roboto-Font-Dateien
├── public/
│   ├── favicon.svg                   Favicon
│   └── favicon.ico                   Favicon
└── src/
    ├── main.jsx                      React-Mounting
    ├── App.jsx                       Root-Komponente
    ├── App.css                       Globale Styles + Notenlinien-Hintergrund
    ├── components/
    │   ├── NamesschildGenerator.jsx  Orchestrierung, State, Export-Trigger
    │   ├── NamesschildPreview.jsx    Canvas Live-Vorschau
    │   └── TextInputPanel.jsx        Formular-Eingaben
    └── utils/
        ├── constants.js              Alle Maße, Farben & Konfiguration
        ├── backgroundRenderer.js     Canvas-Hintergrund (Logo + Streifen)
        ├── fontLoader.js             TTF → Base64 → jsPDF VFS
        └── pdfExport.js              PDF-Generierung (Hybrid-Ansatz)
```

## 🔧 Konfiguration

### Fonts anpassen

Roboto wird lokal aus dem `fonts/` Verzeichnis geladen. Um die Schriftart zu ändern:

1. Neue Font-Dateien im `fonts/` Verzeichnis ablegen (z. B. `FontName-Regular.ttf`, `FontName-Medium.ttf`)
2. Die Pfade in `src/utils/fontLoader.js` (`FONT_LOCAL_PATHS`) auf die neuen Dateien anpassen
3. In `src/utils/constants.js` die Schriftart-Namen ggf. anpassen

### Hintergrund ändern

`src/utils/backgroundRenderer.js` editieren. Die Funktion `renderBackground(ctx)` zeichnet
auf einen Standard Canvas-2D-Kontext. Änderungen sind sofort in der Vorschau **und** im
PDF-Export sichtbar – da beide dieselbe Funktion nutzen.

> Nach Hintergrund-Änderungen im Dev-Betrieb ggf. `clearBackgroundCache()` aus
> `pdfExport.js` aufrufen, damit der PDF-Cache neu aufgebaut wird.

### Maße anpassen

Alle physischen Maße sind zentral in `src/utils/constants.js` unter `PHYSICAL` definiert.
Änderungen dort wirken sich automatisch auf Vorschau und PDF aus.