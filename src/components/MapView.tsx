import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  GeoJSON,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  ScaleControl,
  TileLayer,
  useMap,
} from "react-leaflet";
import L, { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// =====================
// Kleine Utilities
// =====================
async function loadJson<T = any>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return (await res.json()) as T;
}

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// =====================
// GPS‑Hook + Marker
// =====================
type GpsFix = {
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
};

function useGps(
  options: {
    enableHighAccuracy?: boolean;
    maxAgeMs?: number;
    timeoutMs?: number;
  } = {}
) {
  const {
    enableHighAccuracy = true,
    maxAgeMs = 5000,
    timeoutMs = 10000,
  } = options;
  const [fix, setFix] = useState<GpsFix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation nicht verfügbar");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c = pos.coords;
        setFix({
          lat: c.latitude,
          lng: c.longitude,
          accuracy: c.accuracy,
          heading: Number.isFinite(c.heading) ? c.heading : null,
          speed: Number.isFinite(c.speed) ? c.speed : null,
          timestamp: pos.timestamp,
        });
        setError(null);
      },
      (err) => setError(err.message || "GPS-Fehler"),
      { enableHighAccuracy, maximumAge: maxAgeMs, timeout: timeoutMs }
    );
    return () => {
      if (watchId.current !== null)
        navigator.geolocation.clearWatch(watchId.current);
    };
  }, [enableHighAccuracy, maxAgeMs, timeoutMs]);

  return { fix, error };
}

function GpsMarker() {
  const { fix } = useGps();
  if (!fix) return null;
  const pos: [number, number] = [fix.lat, fix.lng];
  return (
    <>
      <Marker position={pos}>
        <Popup>
          <div>
            <strong>Deine Position</strong>
            <br />
            {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)}
            <br />
            Genauigkeit: ±{Math.round(fix.accuracy)} m
            {fix.speed != null && (
              <>
                <br />
                Geschwindigkeit: {Math.round(fix.speed)} m/s
              </>
            )}
          </div>
        </Popup>
      </Marker>
      <Circle center={pos} radius={Math.max(fix.accuracy, 8)} />
    </>
  );
}
// ① Neue Komponente RecenterButton
function RecenterButton() {
  const { fix } = useGps();
  const map = useMap();

  const recenter = () => {
    if (!fix || typeof fix.lat !== "number" || typeof fix.lng !== "number") {
      alert("Noch keine gültige GPS-Position verfügbar.");
      return;
    }
    map.setView([fix.lat, fix.lng], Math.max(map.getZoom(), 14), {
      animate: true,
    });
  };

  return (
    <button
      onClick={recenter}
      style={{
        background: "#111",
        color: "#fff",
        border: "1px solid #333",
        borderRadius: 10,
        padding: "8px 10px",
        cursor: "pointer",
      }}
      title="Auf meine Position zentrieren"
      disabled={!fix}
    >
      📍
    </button>
  );
}

// =====================
// Map beim ersten GPS‑Fix automatisch zentrieren
// =====================
function FollowMyLocationOnce() {
  const { fix } = useGps();
  const map = useMap();
  const didCenter = useRef(false);

  useEffect(() => {
    if (!fix || didCenter.current) return;
    didCenter.current = true;
    const pos = L.latLng(fix.lat, fix.lng);
    map.setView(pos, Math.max(map.getZoom(), 14), { animate: true });
  }, [fix, map]);

  return null;
}

// =====================
// Viadonau/D4D WMS Overlay (Leaflet WMS)
// =====================
function ViadonauWms({
  url = "https://haleconnect.com/ows/services/org.1141.b5f62a22-925d-46f6-a7e2-f763ef489068_wms",
  layers = "",
  format = "image/png",
  transparent = true,
  visible = true,
  zIndex = 400,
  version,
}: {
  url?: string;
  layers?: string;
  format?: string;
  transparent?: boolean;
  visible?: boolean;
  zIndex?: number;
  version?: "1.3.0" | "1.1.1" | string;
}) {
  const map = useMap();

  useEffect(() => {
    if (!visible || !layers) return;
    const wms = L.tileLayer.wms(url, {
      layers,
      format,
      transparent,
      attribution: "Quelle: viadonau/D4D (WMS)",
      crossOrigin: true,
      zIndex,
      ...(version ? { version } : {}),
    });
    wms.addTo(map);
    return () => {
      map.removeLayer(wms);
    };
  }, [map, url, layers, format, transparent, visible, zIndex, version]);

  return null;
}

// =====================
// Info‑Panel (km / Auswahl / Legende)
// =====================
type Selection = { title: string; lines: string[] } | null;

function InfoPanel({
  currentKm,
  selection,
  legend,
}: {
  currentKm?: number | null;
  selection: Selection;
  legend: Array<{ label: string; symbol: string }>;
}) {
  return (
    <aside
      className={classNames("dg-info-panel", "leaflet-top leaflet-left")}
      style={{ position: "absolute", zIndex: 1000, margin: 10 }}
    >
      <div
        style={{
          background: "rgba(18,18,18,.85)",
          color: "#f1f1f1",
          padding: ".75rem 1rem",
          borderRadius: 12,
          backdropFilter: "blur(4px)",
          maxWidth: 280,
          fontSize: 14,
          lineHeight: 1.3,
        }}
      >
        <h3 style={{ margin: ".25rem 0", fontSize: 15 }}>📏 Flusskilometer</h3>
        <div style={{ marginBottom: ".5rem" }}>
          {typeof currentKm === "number" ? `km ${currentKm.toFixed(1)}` : "–"}
        </div>

        <h3 style={{ margin: ".25rem 0", fontSize: 15 }}>ℹ️ Info</h3>
        <div style={{ marginBottom: ".5rem" }}>
          {selection ? (
            <>
              <strong>{selection.title}</strong>
              <ul style={{ margin: ".25rem 0 .25rem 1rem" }}>
                {selection.lines.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </>
          ) : (
            "Feature wählen…"
          )}
        </div>

        <h3 style={{ margin: ".25rem 0", fontSize: 15 }}>🗺️ Legende</h3>
        <ul style={{ margin: ".25rem 0 .25rem 1rem" }}>
          {legend.map((l, i) => (
            <li key={i}>
              <span style={{ marginRight: 6 }}>{l.symbol}</span>
              {l.label}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

// =====================
// Disclaimer‑Panel (IENC nicht zur Navigation)
// =====================
function usePersistentBool(key: string, initial: boolean) {
  const [state, setState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(key);
      return v == null ? initial : v === "true";
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, String(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

function Disclaimer({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <div style={{ position: "absolute", left: 10, bottom: 10, zIndex: 1200 }}>
      <div
        style={{
          background: "rgba(17,17,17,.9)",
          color: "#fff",
          padding: ".6rem .8rem",
          borderRadius: 10,
          border: "1px solid #333",
          maxWidth: 360,
          fontSize: 13,
          lineHeight: 1.35,
          boxShadow: "0 4px 12px rgba(0,0,0,.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <strong>Hinweis</strong>
          <button
            onClick={onClose}
            aria-label="Disclaimer schließen"
            style={{
              background: "transparent",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div>
          IENC‑WMS dient nur zu Planungs‑/Informationszwecken und ist{" "}
          <b>nicht zur Navigation</b> geeignet.
          <br />
          Quelle: viadonau / D4D‑Portal (CC BY 4.0). Fahrwassergebiet (WMS):
          Quelle viadonau.
        </div>
      </div>
    </div>
  );
}

// =====================
// Demo‑GeoJSON (Linie) mit Fit‑to‑Bounds + Click‑Info
// =====================
function DonauDemoLine({
  url,
  onSelect,
  onKm,
}: {
  url: string;
  onSelect: (s: Selection) => void;
  onKm: (km: number | null) => void;
}) {
  const map = useMap();
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    loadJson(url).then(setData).catch(console.error);
  }, [url]);

  // Fit to line once loaded
  useEffect(() => {
    if (!data) return;
    const geo = L.geoJSON(data as any);
    const b = geo.getBounds();
    if (b.isValid())
      map.fitBounds(b as LatLngBoundsExpression, { padding: [20, 20] });
  }, [data, map]);

  if (!data) return null;

  return (
    <GeoJSON
      data={data}
      style={() => ({ color: "#4FC3F7", weight: 4 })}
      onEachFeature={(feature, layer) => {
        layer.on("click", (e) => {
          const p = (feature as any)?.properties || {};
          onSelect({
            title: p.name ?? "Donau‑Abschnitt",
            lines: [
              p.km_start != null && p.km_end != null
                ? `km ${p.km_start} – ${p.km_end}`
                : "km: n/a",
            ].filter(Boolean) as string[],
          });
          const km = typeof p.km_start === "number" ? p.km_start : null;
          onKm(km);
          // kleines Popup an Klickposition
          const content = `<b>Donau</b><br/>${
            p.km_start != null && p.km_end != null
              ? `km ${p.km_start} – ${p.km_end}`
              : ""
          }`;
          L.popup()
            .setLatLng((e as any).latlng)
            .setContent(content)
            .openOn(map);
        });
      }}
    />
  );
}

// =====================
// POI‑Layer (GeoJSON aus /data)
// =====================
function PoisLayer({ url, name }: { url: string; name: string }) {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    loadJson(url).then(setData).catch(console.error);
  }, [url]);

  if (!data) return null;

  return (
    <GeoJSON
      data={data}
      pointToLayer={(feature, latlng) => L.marker(latlng)}
      onEachFeature={(feature: any, layer) => {
        const p = feature?.properties || {};
        const title = p.name || name;
        const km = p.km != null ? `km ${p.km}` : "";
        const type = p.type || "POI";
        layer.bindPopup(`<b>${title}</b><br/>${type}${km ? `<br/>${km}` : ""}`);
      }}
    />
  );
}

// =====================
// Capabilities‑Parser + Cache (WMS GetCapabilities → Layerliste)
// =====================
const CAP_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 Tage

function capCacheKey(url: string) {
  return `wmsCapCache:${url}`;
}

function readCapCache(url: string) {
  try {
    const raw = localStorage.getItem(capCacheKey(url));
    if (!raw) return null;
    const obj = JSON.parse(raw) as {
      etag?: string;
      lastModified?: string;
      xml?: string;
      ts?: number;
    };
    if (!obj || !obj.xml || !obj.ts) return null;
    if (Date.now() - obj.ts > CAP_TTL_MS) return null; // abgelaufen
    return obj;
  } catch {
    return null;
  }
}

function writeCapCache(
  url: string,
  data: { etag?: string; lastModified?: string; xml: string }
) {
  try {
    localStorage.setItem(
      capCacheKey(url),
      JSON.stringify({ ...data, ts: Date.now() })
    );
  } catch {
    /* ignore quota errors */
  }
}

function normalizeCapUrl(capUrl: string) {
  return capUrl.includes("Request=GetCapabilities")
    ? capUrl
    : capUrl +
        (capUrl.includes("?") ? "&" : "?") +
        "SERVICE=WMS&Request=GetCapabilities";
}

async function fetchCapabilitiesWithCache(capUrl: string) {
  const url = normalizeCapUrl(capUrl);
  const cached = readCapCache(url);
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["If-None-Match"] = cached.etag;
  if (cached?.lastModified) headers["If-Modified-Since"] = cached.lastModified;

  try {
    const res = await fetch(url, { headers });
    if (res.status === 304 && cached?.xml) {
      return cached.xml;
    }
    if (!res.ok) {
      // Fallback: nutze Cache, wenn vorhanden
      if (cached?.xml) return cached.xml;
      throw new Error(`Capabilities-Fehler: ${res.status}`);
    }
    const xmlText = await res.text();
    const etag = res.headers.get("ETag") || undefined;
    const lastModified = res.headers.get("Last-Modified") || undefined;
    writeCapCache(url, { etag, lastModified, xml: xmlText });
    return xmlText;
  } catch (e) {
    // Netzwerkfehler → Fallback Cache
    if (cached?.xml) return cached.xml;
    throw e;
  }
}

function parseWmsLayers(xmlText: string) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const layerEls = Array.from(doc.querySelectorAll("Capability Layer Layer"));
  // Fallback: wenn Struktur anders ist, alle Layer-Elemente durchsuchen
  const all = layerEls.length
    ? layerEls
    : Array.from(doc.querySelectorAll("Layer"));
  const layers = all
    .map((el) => ({
      name: el.querySelector("Name")?.textContent?.trim() || "",
      title: el.querySelector("Title")?.textContent?.trim() || "",
    }))
    .filter((l) => l.name);
  return layers;
}

async function fetchWmsLayers(capUrl: string) {
  const xml = await fetchCapabilitiesWithCache(capUrl);
  return parseWmsLayers(xml);
}

// =====================
// Haupt‑Komponente: MapView
// =====================
export default function MapView() {
  // Start‑Center: Untermühl (bleibt beim ersten Render; FitToBounds übernimmt danach)
  const center = useMemo<[number, number]>(() => [48.4446, 13.9184], []);

  // UI‑State
  const [selection, setSelection] = useState<Selection>(null);
  const [currentKm, setCurrentKm] = useState<number | null>(null);
  const [showWms, setShowWms] = usePersistentBool("dg:wms:visible", false); // Default: aus
  const [showIenc, setShowIenc] = usePersistentBool("dg:ienc:visible", true); // Default: an
  const [showDisclaimer, setShowDisclaimer] = usePersistentBool(
    "dg:disclaimer:visible",
    true
  );

  // WMS Layer Auswahl (viadonau Fahrwassergebiet)
  const wmsCapUrl =
    "https://haleconnect.com/ows/services/org.1141.b5f62a22-925d-46f6-a7e2-f763ef489068_wms?SERVICE=WMS&Request=GetCapabilities";
  const [wmsLayers, setWmsLayers] = useState<
    Array<{ name: string; title: string }>
  >([]);
  const [wmsSelected, setWmsSelected] = useState<string>("");
  const [wmsLoading, setWmsLoading] = useState<boolean>(false);
  const [wmsError, setWmsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setWmsLoading(true);
        const layers = await fetchWmsLayers(wmsCapUrl);
        if (cancelled) return;
        setWmsLayers(layers);

        const PREF_WMS = ["Fairway Area Default Style"]; // gewünschter Standard
        const saved = localStorage.getItem("dg:wms:layer") || "";

        const fromSaved = layers.find(
          (l) => l.name === saved || l.title === saved
        );
        const fromPref = layers.find((l) =>
          PREF_WMS.some(
            (p) =>
              (l.title ?? "").toLowerCase() === p.toLowerCase() ||
              (l.name ?? "").toLowerCase() === p.toLowerCase()
          )
        );
        const fromHeuristic = layers.find((l) =>
          /fahrwasser|fairway|fahrwassergebiet/i.test(
            `${l.name ?? ""} ${l.title ?? ""}`
          )
        );

        const pick = fromSaved || fromPref || fromHeuristic || layers[0];
        setWmsSelected(pick?.name || "");
        setWmsError(null);
      } catch (e: any) {
        if (!cancelled) setWmsError(e?.message || "Capabilities nicht ladbar");
      } finally {
        if (!cancelled) setWmsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // IENC (D4D) – Capabilities States & Laden
  const iencCapUrl =
    "https://service.d4d-portal.info/at/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0";
  const [iencLayers, setIencLayers] = useState<
    Array<{ name: string; title: string }>
  >([]);
  const [iencSelected, setIencSelected] = useState<string>("");
  const [iencLoading, setIencLoading] = useState<boolean>(false);
  const [iencError, setIencError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIencLoading(true);
        const layers = await fetchWmsLayers(iencCapUrl);
        if (cancelled) return;
        setIencLayers(layers);

        const PREF_IENC = ["d4dmap"]; // gewünschter Standard
        const saved = localStorage.getItem("dg:ienc:layer") || "";

        const fromSaved = layers.find(
          (l) => l.name === saved || l.title === saved
        );
        const fromPref = layers.find((l) =>
          PREF_IENC.some(
            (p) =>
              (l.title ?? "").toLowerCase() === p.toLowerCase() ||
              (l.name ?? "").toLowerCase() === p.toLowerCase()
          )
        );
        const fromHeuristic = layers.find((l) =>
          /enc|ienc|chart|karte/i.test(`${l.name ?? ""} ${l.title ?? ""}`)
        );

        const pick = fromSaved || fromPref || fromHeuristic || layers[0];
        setIencSelected(pick?.name || "");
        setIencError(null);
      } catch (e: any) {
        if (!cancelled)
          setIencError(e?.message || "IENC Capabilities nicht ladbar");
      } finally {
        if (!cancelled) setIencLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Legende
  const legend = useMemo(
    () => [
      { symbol: "——", label: "Donau (Demo‑Linie)" },
      { symbol: "⬤", label: "POI (z. B. Hafen)" },
      { symbol: "▨", label: "Fahrwassergebiet (WMS)" },
      { symbol: "▥", label: "IENC (WMS)" },
    ],
    []
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ width: "100%", height: "100%", background: "#e5e5e5" }}
      >
        <ScaleControl position="bottomleft" />
        <FollowMyLocationOnce />
        <LayersControl position="topright">
          {/* Basiskarten */}
          <LayersControl.BaseLayer checked name="OSM Standard">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
              crossOrigin
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenTopo">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenTopoMap"
              crossOrigin
            />
          </LayersControl.BaseLayer>

          {/* Overlays */}
          <LayersControl.Overlay checked name="Donau Demo‑Linie">
            <div>
              <DonauDemoLine
                url="/donau_line_demo.geojson"
                onSelect={setSelection}
                onKm={setCurrentKm}
              />
            </div>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="POIs: Häfen (Beispiel)">
            <div>
              <PoisLayer url="/data/pois_hafen.geojson" name="Hafen" />
            </div>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Fahrwassergebiet (viadonau WMS)">
            <div>
              <ViadonauWms visible={showWms} layers={wmsSelected} />
            </div>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="IENC (D4D WMS)">
            <div>
              <ViadonauWms
                visible={showIenc}
                url="https://service.d4d-portal.info/at/wms"
                layers={iencSelected}
                version="1.3.0"
              />
            </div>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="GPS‑Position">
            <div>
              <GpsMarker />
            </div>
          </LayersControl.Overlay>
        </LayersControl>
        {/* 📍 Recenter innerhalb des MapContainer, damit useMap() funktioniert */}
        <div
          className="leaflet-bottom leaflet-right"
          style={{ position: "absolute", right: 10, bottom: 50, zIndex: 1200 }}
        >
          <RecenterButton />
        </div>
      </MapContainer>

      {/* Info‑Panel */}
      <InfoPanel currentKm={currentKm} selection={selection} legend={legend} />

      {/* WMS Controls (rechts unten) */}
      <div
        style={{ position: "absolute", right: 10, bottom: 10, zIndex: 1100 }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* viadonau WMS */}
          <button
            onClick={() => setShowWms((v) => !v)}
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
            }}
            title="WMS Fahrwasser ein/aus"
          >
            {showWms ? "WMS: an" : "WMS: aus"}
          </button>

          <select
            value={wmsSelected}
            onChange={(e) => {
              const v = e.target.value;
              setWmsSelected(v);
              try {
                localStorage.setItem("dg:wms:layer", v);
              } catch {}
            }}
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: 10,
              padding: "8px 10px",
            }}
            title={wmsError ? `Fehler: ${wmsError}` : "WMS-Layer wählen"}
          >
            {wmsLoading && <option>lädt…</option>}
            {!wmsLoading && wmsLayers.length === 0 && (
              <option>keine Layer</option>
            )}
            {!wmsLoading &&
              wmsLayers.map((l) => (
                <option key={l.name} value={l.name}>
                  {l.title || l.name}
                </option>
              ))}
          </select>

          {/* IENC (D4D) */}
          <button
            onClick={() => setShowIenc((v) => !v)}
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
            }}
            title="IENC WMS ein/aus"
          >
            {showIenc ? "IENC: an" : "IENC: aus"}
          </button>

          <select
            value={iencSelected}
            onChange={(e) => {
              const v = e.target.value;
              setIencSelected(v);
              try {
                localStorage.setItem("dg:ienc:layer", v);
              } catch {}
            }}
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: 10,
              padding: "8px 10px",
            }}
            title={iencError ? `Fehler: ${iencError}` : "IENC-Layer wählen"}
          >
            {iencLoading && <option>lädt…</option>}
            {!iencLoading && iencLayers.length === 0 && (
              <option>keine Layer</option>
            )}
            {!iencLoading &&
              iencLayers.map((l) => (
                <option key={l.name} value={l.name}>
                  {l.title || l.name}
                </option>
              ))}
          </select>

          {/* Info Toggle */}
          <button
            onClick={() => setShowDisclaimer((v: boolean) => !v)}
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
            }}
            title="Disclaimer ein-/ausblenden"
          >
            ℹ︎
          </button>
          {/* 📍 Neuer Button hier einfügen */}
          {/*  <RecenterButton />*/}
        </div>
        {/* 👉 Neuer Button auch nicht !!!hier */}
        {/*<RecenterButton />*/}
      </div>
      {/* 👉 Neuer Button auch nicht !!!hier */}
      {/*<RecenterButton />*/}
      {/* Disclaimer unten links */}
      <Disclaimer
        visible={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
      />
    </div>
  );
}
