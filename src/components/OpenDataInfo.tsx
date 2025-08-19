import React, { useEffect, useState } from 'react'
import { DATA_GV_BASE, STRECKENATLAS_DATASET_ID, IENC_DATASET_ID } from '../config.opendata'

type Pkg = { result?: any }
async function fetchCkanPackage(id:string){
  try{
    const res = await fetch(`${DATA_GV_BASE}/api/3/action/package_show?id=${id}`)
    if(!res.ok) throw new Error('CKAN error')
    return (await res.json()) as Pkg
  }catch(_e){
    return { result: null }
  }
}

export default function OpenDataInfo(){
  const [atlas, setAtlas] = useState<any>(null)
  const [ienc, setIenc] = useState<any>(null)

  useEffect(()=>{
    fetchCkanPackage(STRECKENATLAS_DATASET_ID).then(p=> setAtlas(p.result))
    fetchCkanPackage(IENC_DATASET_ID).then(p=> setIenc(p.result))
  },[])

  const fmt = (s?:string)=> s ? new Date(s).toLocaleDateString() : '—'

  return (
    <div className="item">
      <h2>Open Data</h2>
      <div className="small">Quellen werden automatisch aus CKAN geladen (falls CORS erlaubt).</div>
      <ul className="small">
        <li><strong>Streckenatlas (PDF)</strong> – ID {STRECKENATLAS_DATASET_ID}<br/>
          Aktualisiert: {fmt(atlas?.metadata_modified)} · Lizenz: CC BY 4.0
        </li>
        <li><strong>Inland ENCs (WMS/WFS/S-57)</strong> – ID {IENC_DATASET_ID}<br/>
          Aktualisiert: {fmt(ienc?.metadata_modified)} · Lizenz: CC BY 4.0
        </li>
      </ul>
    </div>
  )
}
