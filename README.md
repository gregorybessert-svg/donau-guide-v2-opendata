# Donau Guide · OpenData Starter

**Was kann dieses Projekt?**
- Leaflet-Karte mit GPS, KM-Anzeige entlang einer groben Donau-Linie (Demo)
- **WMS-Explorer**: Inland ENCs (D4D) und **Bojen** (haleconnect) werden per *GetCapabilities* geladen – du wählst die Layer und blendest sie ein.
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
