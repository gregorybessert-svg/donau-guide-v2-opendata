import { useEffect } from 'react'
import { useAppStore } from '../store'

export function useGps(){
  const gpsEnabled = useAppStore(s=>s.gpsEnabled)
  const setPosition = useAppStore(s=>s.setPosition)

  useEffect(()=>{
    if(!gpsEnabled || !('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      p=> setPosition({lat: p.coords.latitude, lon: p.coords.longitude}),
      _e=> {}, // handle errors if needed
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
    return ()=> navigator.geolocation.clearWatch(id)
  },[gpsEnabled, setPosition])
}
