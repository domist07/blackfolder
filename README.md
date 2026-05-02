# LJC-Namensschild Generator

Erstelle dein eigenes Landesjugendchor Namensschild für deine Notenmappe — direkt im Browser, ohne Installation.

## Vorschau

Eine interaktive Web-Anwendung zur Generierung personalisierter Namensschilder im LJC-Design mit Live-Vorschau und PDF-Export in Druckqualität.

## Features

- Live-Vorschau während der Eingabe
- Automatische Schriftgrößenanpassung bei langen Namen
- Manueller Zeilenumbruch in der E-Mail-Zeile (mit /)
- PDF-Export in 600 DPI (Druckqualität)
- Export als einzelnes Namensschild (95 × 60 mm)
- Export als DIN A4 mit Schnittmarkierungen
- Responsive Design (Desktop, Tablet, Mobil)
- Automatische Speicherung im Browser (LocalStorage)
- Keine Serveranbindung, keine Datenübertragung

## Design-Philosophie

### Visuelles Konzept

Das Design orientiert sich am Corporate Design des Landesjugendchors Baden-Württemberg. Die Farbpalette beschränkt sich auf Rot (#9d0000) und ein aufgehelltes Rot (#b13333), ergänzt durch Weiß für Text und UI-Elemente.

Der Seitenhintergrund besteht aus vertikalen Streifen, die das LJC-Branding subtil aufgreifen, ohne vom Inhalt abzulenken.

### Typografie-Regeln

- Vor- und Nachname: Startgröße 40pt, bold, maximal 65mm breit
- Rufnummer und E-Mail: Startgröße 24pt, regular, maximal 50mm breit
- Vorname wird nie kleiner als der Nachname dargestellt
- Rufnummer und E-Mail haben immer die gleiche Schriftgröße
- Alle Texte sind linksbündig mit 5mm Abstand zum linken Rand

### Schriftgrößen-Algorithmus

1. Berechne individuelle Schriftgröße für Vorname und Nachname basierend auf maximaler Breite (65mm)
2. Verwende die kleinere der beiden Größen für beide Namen
3. Berechne individuelle Schriftgröße für Rufnummer und jede E-Mail-Zeile basierend auf maximaler Breite (50mm)
4. Verwende die kleinste Größe für alle Kontaktdaten

### Architektur

Die Anwendung folgt dem Prinzip der Separation of Concerns:

- index.html — Struktur und Semantik
- css/styles.css — Präsentation und Layout
- js/background.js — Statischer Namensschild-Hintergrund (Canvas-Pfade)
- js/canvas.js — Text-Rendering und Schriftgrößenberechnung
- js/export.js — PDF-Generierung mit 600 DPI
- js/app.js — Anwendungslogik, Events und State-Management

### Exportqualität

Der PDF-Export rendert das Namensschild intern auf einem hochaufgelösten Off-Screen-Canvas (2244 × 1417 px bei 600 DPI) und komprimiert das Ergebnis als JPEG (92% Qualität). Das ergibt scharfe Druckergebnisse bei kompakter Dateigröße.

## Projektstruktur

```
ljc-namensschild/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── background.js
│   ├── canvas.js
│   ├── export.js
│   └── app.js
└── README.md
```

## Installation

### Voraussetzungen

- Ein moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Keine weiteren Abhängigkeiten, kein Build-Prozess, kein Node.js

### Lokales Ausführen

1. Repository klonen

```bash
git clone https://github.com/TODO_PLATZHALTER_REPO/ljc-namensschild.git
```

2. In das Verzeichnis wechseln

```bash
cd ljc-namensschild
```

3. Einen lokalen Server starten (beliebige Methode)

Mit Python 3:
```bash
python -m http.server 8000
```

Mit Node.js (npx):
```bash
npx serve .
```

Mit VS Code:
Live Server Extension installieren und index.html öffnen

4. Im Browser öffnen

```
http://localhost:8000
```

### Hinweis

Die Anwendung kann auch direkt als Datei geöffnet werden (index.html doppelklicken), allerdings laden manche Browser externe Scripts (jsPDF) nicht im file://-Protokoll. Ein lokaler Server wird empfohlen.

## Verwendung

1. Vorname und Nachname eingeben (Pflichtfelder)
2. Optional: Rufnummer eingeben
3. Optional: E-Mail eingeben — für einen manuellen Zeilenumbruch ein / einfügen
4. Die Vorschau aktualisiert sich automatisch bei jeder Eingabe
5. PDF herunterladen über einen der beiden Export-Buttons

## Technologien

- HTML5 Canvas API für Rendering
- CSS Grid und Flexbox für responsives Layout
- Vanilla JavaScript (ES6+, keine Frameworks)
- jsPDF 2.5.1 für PDF-Generierung (CDN)
- LocalStorage für clientseitige Datenpersistenz

## Browser-Kompatibilität

- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+
