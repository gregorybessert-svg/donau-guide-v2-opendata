# Donau Guide · OpenData Starter

**Was kann dieses Projekt?**

- Leaflet-Karte mit GPS, KM-Anzeige entlang einer groben Donau-Linie (Demo)
- **WMS-Explorer**: Inland ENCs (D4D) und **Bojen** (haleconnect) werden per _GetCapabilities_ geladen – du wählst die Layer und blendest sie ein.
- **CKAN-Metadaten** (data.gv.at) werden – sofern CORS erlaubt – angezeigt.
- **Attribution** (CC BY 4.0, Datenquelle: viadonau.org) ist fix eingebaut.

## Schnellstart

```bash
npm install
npm run dev
```

## Open-Data-Quellen

- Streckenatlas (PDF): data.gv.at Dataset-ID `d49557cc-0861-43f6-89a3-f7150b19af00`
- Inland ENCs (WMS/WFS/S-57): Dataset-ID `ee58c573-b520-4813-b85a-00a0951df0dd`
- Bojen (WMS/WFS): siehe Dataset-Seite `viadonau_bojenderdonausterreich1`

## Hinweise

- Manche Services verlangen **CORS**. Falls der Browser blockt, nutze zunächst die **WMS-Overlays** (laufen fast immer), oder betreibe einen kleinen Proxy.
- Die Demo-Donau-Linie dient nur zur KM-Anzeige. Ersetze sie durch eine präzisere Geometrie.

# 📦 Donau-Guide V2 – OpenData

## [0.2.1] – 2025-08-21

### ✨ Neue Funktionen

- **Leaflet-Integration**

  - Projekt auf `vite + react + leaflet` aufgesetzt.
  - OpenStreetMap (OSM) Kachelserver als Basislayer eingebunden.
  - Tile-Layer mit Attribution & CrossOrigin konfiguriert.

- **MapView-Komponente**

  - Zentrale React-Komponente für die Karte (`src/components/MapView.tsx`).
  - Nutzung von `MapContainer`, `TileLayer`, `GeoJSON`, `Marker`, `Popup`.
  - Automatische Zentrierung/Zoom auf GeoJSON-Linienzug mit `FitToLine`.
  - Testmarker in **Untermühl** zur Standortprüfung.

- **GeoJSON-Testdaten**

  - Datei `public/donau_line_demo.geojson` hinzugefügt.
  - Beinhaltet einen Test-Abschnitt der Donau bei **Untermühl**.
  - Properties `km_start`, `km_end` ergänzt (Vorbereitung für Kilometeranzeige).

- **App-Struktur**
  - `main.tsx`: rendert App, lädt Leaflet-CSS und globale Styles.
  - `App.tsx`: Rahmenkomponente, lädt `MapView`.
  - `styles.css`: vereinfachte Styles (100% Höhe für Container, grauer Hintergrund zum Testen).

### 🛠 Entwicklungsumgebung

- CodeSandbox mit GitHub-Repo `donau-guide-v2-opendata` verbunden.
- Abhängigkeiten bereinigt (`vite`, `@vitejs/plugin-react`, `leaflet`, `react-leaflet`).
- Dev-Server über Port `5173` (Sandbox-Primary Port gesetzt).

### 📂 Projektstruktur

/public
└─ donau_line_demo.geojson # Test-Abschnitt Untermühl
/src
├─ main.tsx # Einstieg, Styles + App mount
├─ App.tsx # App-Rahmen, lädt MapView
├─ styles.css # Globale Layout- & Map-Styles
└─ components/
└─ MapView.tsx # Karte, OSM Tiles, GeoJSON, FitToLine

### 🚀 Nächste Schritte

- GPS-Anbindung (`useGps`-Hook) für Smartphone-Tracking.
- Anbindund von wms Service Via Donau
- _WMS Fahrwassergebiet
  Herunterladen
  Details
  Datensatz, Dienst oder Dokument Änderungsdatum 13. Januar 2022
  Metadaten zuletzt aktualisiert 28. November 2024
  Datensatz, Dienst oder Dokument Format WMS
  Eindeutiger Identifier Datensatz, Dienst oder Dokument 0e8b0aa5-66dc-4631-bf0c-45db0a8566ca
  Eindeutiger Identifier Metadatenblatt ee36a341-683f-4486-bf03-3c5b7424153a
  URL zu Datensatz, Dienst oder Dokument https://haleconnect.com/ows/services/org.1141.b5f62a22-925d-46f6-a7e2-f763ef489068_wms?SERVICE=WMS&Request=GetCapabilities_
- link u wms API https://haleconnect.com/ows/services/org.1141.b5f62a22-925d-46f6-a7e2-f763ef489068_wms?SERVICE=WMS&Request=GetCapabilities
- Weitere **GeoJSON-Daten** (weitere Donauabschnitte, POIs).
- Integration **OpenData von viadonau** (Schleusen, Brücken, Häfen).
- Layer-Control (Umschalten zwischen OSM, OpenTopo, viadonau WMS).
- UI-Erweiterungen: Panel mit aktuellen Flusskilometern, POI-Infos, Legende.
