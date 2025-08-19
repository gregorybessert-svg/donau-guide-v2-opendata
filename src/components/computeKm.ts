import * as turf from '@turf/turf'

export async function loadJSON<T=any>(path:string): Promise<T>{
  const res = await fetch(path)
  if(!res.ok) throw new Error(`Failed to load ${path}`)
  return res.json()
}

export function computeKm(
  donauLine: GeoJSON.Feature<GeoJSON.LineString, { km_start:number, km_end:number }>,
  user: turf.helpers.Position
): number | null {
  try{
    const start = turf.point(donauLine.geometry.coordinates[0] as turf.helpers.Position)
    const snapped = turf.nearestPointOnLine(donauLine as any, user, {units:'kilometers'}) as any
    const sliced = turf.lineSlice(start, snapped, donauLine as any) as any
    const progressKm = turf.length(sliced, {units:'kilometers'})
    const totalKm = turf.length(donauLine as any, {units:'kilometers'})
    const ratio = totalKm === 0 ? 0 : (progressKm / totalKm)
    const { km_start, km_end } = donauLine.properties!
    const km = km_start + ratio * (km_end - km_start)
    return Math.round(km * 10) / 10
  }catch(_e){
    return null
  }
}
