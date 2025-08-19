import React from 'react'
import { useAppStore } from '../store'

export default function GpsButton(){
  const gpsEnabled = useAppStore(s=>s.gpsEnabled)
  const setGpsEnabled = useAppStore(s=>s.setGpsEnabled)
  return <button onClick={()=> setGpsEnabled(!gpsEnabled)}>{gpsEnabled ? 'GPS an · Stop' : 'GPS aus · Start'}</button>
}
