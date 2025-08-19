import { create } from 'zustand'

type Pos = { lat:number, lon:number }

type State = {
  gpsEnabled: boolean
  position: Pos | null
  km: number | null
  setGpsEnabled: (v:boolean) => void
  setPosition: (p:Pos | null) => void
  setKm: (km:number | null) => void
}

export const useAppStore = create<State>((set)=> ({
  gpsEnabled: false,
  position: null,
  km: null,
  setGpsEnabled: (v)=> set({gpsEnabled:v}),
  setPosition: (p)=> set({position:p}),
  setKm: (km)=> set({km})
}))
