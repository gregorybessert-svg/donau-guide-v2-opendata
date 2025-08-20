import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'

type DonauLine = GeoJSON.Feature<GeoJSON.LineString, { km_start: number, km_end: number }>

// Hilfskomponente: zoomt automatisch auf die Linie
function FitToLine({ line }: { line: DonauLine | null }) {
  const map = useMap()
  useEffect(() => {
    if (line) {
      const coords = line.geometry.coordinates.map(c => [c[1], c[0]]) // [lat, lon]
      map.fitBounds(L.latLngBounds(coords).pad(0.2))
    }
  }, [line, map])
  return null
}

export default function MapView() {
  const [line, setLine] = useState<DonauLine | null>(null)

  // Demo-GeoJSON laden
  useEffect(() => {
    fetch('/donau_line_demo.geojson')
      .then(res => res.json())
      .then(setLine)
      .catch(() => setLine(null))
  }, [])

  return (
    <MapContainer
      className="leaflet-container"
      style={{ height: '100%', width: '100%' }}
      center={[48.21, 16.37]} // Fallback (Wien)
      zoom={8}                // Fallback-Zoom, wird durch FitToLine überschrieben
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        crossOrigin=""
      />
      {line && (
        <>
          <GeoJSON data={line as any} style={{ color: '#38bdf8', weight: 3 }} />
          <FitToLine line={line} />
        </>
      )}
      {/* Testmarker, kannst du später entfernen */}
      <Marker position={[48.4760, 13.8865]}>
        <Popup>Untermühl (Testmarker)</Popup>
      </Marker>
    </MapContainer>
  )
}
