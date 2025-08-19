import React from 'react'
import { useAppStore } from '../store'

export default function KmIndicator(){
  const km = useAppStore(s=>s.km)
  return <div className="km">KM: <strong>{km ?? '—'}</strong></div>
}
