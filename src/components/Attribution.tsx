import React from 'react'
import { LICENSE_ATTR } from '../config.opendata'

export default function Attribution(){
  return (
    <footer className="footer" role="contentinfo">
      <div>{LICENSE_ATTR}</div>
      <div className="badge">Open Data</div>
    </footer>
  )
}
