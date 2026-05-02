### 🎵 LJC Namensschild Generator

> Erstelle personalisierte Namensschilder für den Landesjugendchor – direkt im Browser, als druckfertiges Vektor-PDF.

---

#### ✨ Features


- **Live-Vorschau** – Echtzeit-Rendering während der Eingabe
- **Vektor-PDF-Export** – Text bleibt scharf bei jeder Zoomstufe, durchsuchbar & kopierbar
- **Automatische Schriftanpassung** – Text wird dynamisch verkleinert, wenn er zu breit wird
- **Offline-fähig** – Eingaben werden im LocalStorage gespeichert
- **Zwei Export-Modi** – Einzelnes Namensschild oder A4-Druckvorlage mit Schnittmarkierungen
- **Custom Font** – Roboto wird direkt ins PDF eingebettet

---

#### 📐 Design-Spezifikationen

| Eigenschaft      | Wert                          |
|------------------|-------------------------------|
| Format           | 95 × 60 mm (Querformat)       |
| Hintergrund      | LJC-Rot `#9d0000`             |
| Schriftfarbe     | Weiß `#FFFFFF`                |
| Schriftart       | Roboto (Regular + Medium)     |
| Vor-/Nachname    | 36pt, fett, max. 65 mm breit  |
| Kontaktdaten     | 14pt, normal, max. 50 mm breit|
| Min. Schriftgröße| 8pt                           |

---

#### 🎨 Design Philosophy

##### 1. Single Source of Truth

Der Hintergrund (Logo, Streifen, rote Fläche) wird **einmal** in `backgroundRenderer.js` definiert und sowohl für die Canvas-Vorschau als auch für den PDF-Export verwendet. Keine doppelte Pflege, keine Abweichungen.

```
    backgroundRenderer.js
            │
            ├──→ Canvas-Vorschau (Live)
            │
            └──→ PDF-Export (gecachtes Bild)
```

##### 2. Hybrid-Rendering im PDF

| Layer       | Technik                       | Warum                              |
|-------------|-------------------------------|------------------------------------|
| Hintergrund | PNG aus Canvas (gecacht)      | Komplexe Bezier-Pfade des Logos    |
| Text        | jsPDF `.text()` Vektor-API    | Scharf, durchsuchbar, editierbar   |

→ Bester Kompromiss zwischen visueller Treue und Textqualität.

##### 3. Responsive Typography

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

##### 4. CSS-Variablen für Theming

Alle Farben sind als CSS Custom Properties definiert. Die Website-Notenlinien nutzen `color-mix()` mit den Projektvariablen – kein Hardcoding von Farbwerten außerhalb von `:root`.

```js
    --primary-color: #9d0000;
    --primary-light: #b13333;
    --notenlinie: color-mix(in srgb, var(--primary-light) 20%, transparent);
```

##### 5. Performance-First Export


- Fonts werden beim App-Start im Hintergrund vorgeladen (`preloadFonts()` in `useEffect`)
- Der gerenderte Hintergrund wird nach dem ersten Export als Data-URL gecacht

- Erster Export: ~80ms – Zweiter Export: ~15ms (Cache-Hit)

---

#### 🛠️ Tech Stack

| Technologie                                                        | Zweck                          |
|--------------------------------------------------------------------|--------------------------------|
| [React 18](https://react.dev)                                      | UI-Komponenten & State         |
| [Vite 5](https://vitejs.dev)                                       | Build-Tool & Dev-Server        |
| [jsPDF](https://github.com/parallax/jsPDF)                         | PDF-Generierung                |
| [Google Fonts – Roboto](https://fonts.google.com/specimen/Roboto)  | Schriftart in der Vorschau     |
| Canvas 2D API                                                      | Live-Vorschau & Text-Messung   |

---

#### 📦 Installation

##### Voraussetzungen

- [Node.js](https://nodejs.org/) ≥ 18.x
- npm ≥ 9.x

##### Schritte

**1. Repository klonen**

```bash
git clone https://github.com/DEIN-USERNAME/ljc-namensschild-generator.git
cd ljc-namensschild-generator
```

**2. Dependencies installieren**

```bash
npm install
```

**3. Font-Dateien herunterladen**

Lade das Roboto-Paket von [Google Fonts](https://fonts.google.com/specimen/Roboto) herunter
(Button „Download family") und lege folgende Dateien ab:

```
    public/fonts/Roboto-Regular.ttf
    public/fonts/Roboto-Medium.ttf
```

**4. Entwicklungsserver starten**

```bash
npm run dev
```

Der Browser öffnet automatisch `http://localhost:3000`.

##### Produktion

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

---

#### 📂 Projektstruktur

```
    ljc-namensschild-generator/
    ├── index.html                        Einstiegspunkt + Google Fonts Link
    ├── package.json
    ├── vite.config.js
    ├── public/
    │   └── fonts/
    │       ├── Roboto-Regular.ttf        Für PDF-Einbettung (manuell ablegen)
    │       └── Roboto-Medium.ttf         Für PDF-Einbettung (manuell ablegen)
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

---

#### 🔧 Konfiguration

##### Fonts austauschen


1. Neue `.ttf`-Dateien in `public/fonts/` ablegen
2. Dateinamen in `src/utils/fontLoader.js` anpassen

3. `FONTS.PREVIEW` in `src/utils/constants.js` ändern
4. Google Fonts `<link>` in `index.html` aktualisieren

##### Hintergrund ändern

`src/utils/backgroundRenderer.js` editieren. Die Funktion `renderBackground(ctx)` zeichnet
auf einen Standard Canvas-2D-Kontext. Änderungen sind sofort in der Vorschau **und** im
PDF-Export sichtbar – da beide dieselbe Funktion nutzen.

> Nach Hintergrund-Änderungen im Dev-Betrieb ggf. `clearBackgroundCache()` aus
> `pdfExport.js` aufrufen, damit der PDF-Cache neu aufgebaut wird.

##### Maße anpassen

Alle physischen Maße sind zentral in `src/utils/constants.js` unter `PHYSICAL` definiert.
Änderungen dort wirken sich automatisch auf Vorschau und PDF aus.

---

#### 🖨️ Druckanleitung


1. Alle Felder ausfüllen
2. **„📄 A4 zum Drucken"** klicken
3. PDF öffnen und drucken mit:

   - Skalierung: **100% / Tatsächliche Größe**
   - ⚠️ „An Seite anpassen" muss deaktiviert sein

4. Entlang der grauen Schnittmarkierungen ausschneiden
5. Fertig – in die Notenmappe einlegen
