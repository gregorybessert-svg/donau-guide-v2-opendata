import { XMLParser } from 'fast-xml-parser'

export type WmsLayer = { name:string, title:string }

export async function fetchWmsLayers(capabilitiesUrl:string): Promise<WmsLayer[]>{
  const res = await fetch(capabilitiesUrl)
  if(!res.ok) throw new Error('WMS GetCapabilities failed')
  const xml = await res.text()
  const parser = new XMLParser({ ignoreAttributes:false })
  const json = parser.parse(xml)
  const layers: WmsLayer[] = []
  // Parse common WMS structure: WMS_Capabilities.Capability.Layer.Layer[]
  const root = json.WMS_Capabilities || json.WMT_MS_Capabilities || json
  const inner = root.Capability?.Layer?.Layer || []
  const list = Array.isArray(inner) ? inner : [inner]
  for(const l of list){
    const name = l.Name
    const title = l.Title || name
    if(name) layers.push({ name, title })
  }
  return layers
}
