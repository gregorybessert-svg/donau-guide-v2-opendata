import React, { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { fetchWmsLayers, WmsLayer } from '../lib/wms'
import { IENC_WMS, BOJEN_WMS_CAPS, LICENSE_ATTR } from '../config.opendata'

type Added = { name:string, layer:L.TileLayer.WMS }

export default function WmsExplorer(){
  const map = useMap()
  const [iencLayers, setIencLayers] = useState<WmsLayer[]>([])
  const [iencSelected, setIencSelected] = useState<string>('')
  const [bojenLayers, setBojenLayers] = useState<WmsLayer[]>([])
  const [bojenSelected, setBojenSelected] = useState<string>('')
  const [added, setAdded] = useState<Added[]>([])

  useEffect(()=>{
    fetchWmsLayers(`${IENC_WMS}?SERVICE=WMS&REQUEST=GetCapabilities`).then(setIencLayers).catch(()=> setIencLayers([]))
    fetchWmsLayers(BOJEN_WMS_CAPS).then(setBojenLayers).catch(()=> setBojenLayers([]))
  },[])

  function addWms(baseUrl:string, layerName:string){
    const l = L.tileLayer.wms(baseUrl, {
      layers: layerName,
      format: 'image/png',
      transparent: true,
      opacity: 0.8,
      attribution: LICENSE_ATTR
    })
    l.addTo(map)
    setAdded(prev=> [...prev, { name: layerName, layer: l }])
  }
  function removeWms(layerName:string){
    const found = added.find(a=> a.name===layerName)
    if(!found) return
    map.removeLayer(found.layer)
    setAdded(prev=> prev.filter(a=> a.name!==layerName))
  }
  const isAdded = (name:string)=> added.some(a=> a.name===name)

  return (
    <div className="item">
      <h2>WMS-Layer</h2>
      <div>
        <label>Inland ENCs (WMS) – wähle Layer</label>
        <select className="select" value={iencSelected} onChange={e=> setIencSelected(e.target.value)}>
          <option value="">— bitte wählen —</option>
          {iencLayers.map(l=> <option key={l.name} value={l.name}>{l.title} ({l.name})</option>)}
        </select>
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button className="secondary" onClick={()=> iencSelected && addWms(IENC_WMS, iencSelected)} disabled={!iencSelected}>Einblenden</button>
          <button className="secondary" onClick={()=> iencSelected && removeWms(iencSelected)} disabled={!iencSelected || !isAdded(iencSelected)}>Ausblenden</button>
        </div>
      </div>
      <div style={{marginTop:12}}>
        <label>Bojen (WMS) – wähle Layer</label>
        <select className="select" value={bojenSelected} onChange={e=> setBojenSelected(e.target.value)}>
          <option value="">— bitte wählen —</option>
          {bojenLayers.map(l=> <option key={l.name} value={l.name}>{l.title} ({l.name})</option>)}
        </select>
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button className="secondary" onClick={()=> bojenSelected && addWms(BOJEN_WMS_CAPS.replace('?SERVICE=WMS&Request=GetCapabilities',''), bojenSelected)} disabled={!bojenSelected}>Einblenden</button>
          <button className="secondary" onClick={()=> bojenSelected && removeWms(bojenSelected)} disabled={!bojenSelected || !isAdded(bojenSelected)}>Ausblenden</button>
        </div>
      </div>
      <div className="small" style={{marginTop:10}}>Tipp: Zoome in deinen Abschnitt. Falls nichts erscheint, ist evtl. der gewählte Layer außerhalb des aktuellen Kartenausschnitts.</div>
    </div>
  )
}
