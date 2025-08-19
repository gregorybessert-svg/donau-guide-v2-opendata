import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore } from '../store'
import '../lib/leaflet-fix'
import { computeKm, loadJSON } from './computeKm'
import { useGps } from '../lib/useGps'

type DonauLine = GeoJSON.Feature<GeoJSON.LineString, {km_start:number, km_end:number}>

function KmUpdater({ line }:{ line: DonauLine | null }){
  const pos = useAppStore(s=>s.position)
  const setKm = useAppStore(s=>s.setKm)
  useEffect(()=>{
    if(!line || !pos) { setKm(null); return }
    const km = computeKm(line, [pos.lon, pos.lat])
    setKm(km)
  },[line, pos, setKm])
  return null
}

function FitAustriaOnce(){
  const map = useMap()
  useEffect(()=>{
    map.fitBounds(L.latLngBounds([[48.51,13.73],[48.14,17.06]]).pad(0.2))
  },[map])
  return null
}

export default function MapView(){
  const pos = useAppStore(s=>s.position)
  const [line, setLine] = useState<DonauLine | null>(null)
  useGps()

  useEffect(()=>{
    loadJSON<DonauLine>('/donau_line_demo.geojson').then(setLine).catch(()=> setLine(null))
  },[])

  return (
    <MapContainer className="leaflet-container" style={{height:'100%', width:'100%'}} center={[48.224, 14.872]} zoom={8}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {line && <GeoJSON data={line as any} style={{ color:'#38bdf8', weight:3 }} />}
      {pos && <Marker position={[pos.lat, pos.lon]}><Popup>Dein Standort</Popup></Marker>}
      <KmUpdater line={line} />
      <FitAustriaOnce />
    </MapContainer>
  )
}
