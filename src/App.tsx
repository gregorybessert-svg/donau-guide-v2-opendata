import React from 'react'
import MapView from './components/MapView'
import KmIndicator from './components/KmIndicator'
import GpsButton from './components/GpsButton'
import OpenDataInfo from './components/OpenDataInfo'
import WmsExplorer from './components/WmsExplorer'
import Attribution from './components/Attribution'

export default function App(){
  return (
    <div className="app">
      <header className="header">
        <span className="logo" aria-hidden="true" />
        <h1>Donau Guide · OpenData</h1>
        <div className="spacer" />
        <KmIndicator />
        <GpsButton />
      </header>
      <div className="content">
        <div className="map"><MapView /></div>
        <aside className="panel">
          <OpenDataInfo />
          <WmsExplorer />
        </aside>
      </div>
      <Attribution />
    </div>
  )
}
