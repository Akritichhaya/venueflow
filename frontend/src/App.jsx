import { useState, useEffect, useCallback } from 'react'
import { subscribeToZones } from './firebase'
import MapView from './components/MapView'
import ZonePanel from './components/ZonePanel'
import StatsBar from './components/StatsBar'
import GeminiChat from './components/GeminiChat'
import AlertsBanner from './components/AlertsBanner'
import './App.css'

const API = import.meta.env.VITE_API_URL || '/api'

export default function App() {
  const [zones, setZones]           = useState([])
  const [alerts, setAlerts]         = useState([])
  const [analysis, setAnalysis]     = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [lastUpdated, setLastUpdated]   = useState(null)
  const [loading, setLoading]       = useState(true)

  // Subscribe to Firebase Realtime DB for live zone data
  useEffect(() => {
    const unsubscribe = subscribeToZones((liveZones) => {
      setZones(liveZones)
      setAlerts(liveZones.filter(z => z.density > 80))
      setLastUpdated(new Date())
      setLoading(false)
    })

    // Fallback: fetch from backend if Firebase not yet seeded
    fetch(`${API}/crowd/zones`)
      .then(r => r.json())
      .then(d => {
        if (d.zones?.length && zones.length === 0) {
          setZones(d.zones)
          setAlerts(d.zones.filter(z => z.density > 80))
          setLoading(false)
        }
      })
      .catch(console.error)

    return () => unsubscribe()
  }, [])

  // Gemini crowd analysis — runs every 60s
  const runAnalysis = useCallback(async () => {
    if (!zones.length) return
    try {
      const res = await fetch(`${API}/gemini/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones, event_name: 'Match Day' })
      })
      const data = await res.json()
      setAnalysis(data)
    } catch (e) {
      console.error('Gemini analysis error:', e)
    }
  }, [zones])

  useEffect(() => {
    if (zones.length) runAnalysis()
    const interval = setInterval(runAnalysis, 60000)
    return () => clearInterval(interval)
  }, [zones.length])

  const stats = {
    avgDensity: zones.length
      ? Math.round(zones.reduce((s, z) => s + z.density, 0) / zones.length)
      : 0,
    criticalZones: zones.filter(z => z.status === 'critical').length,
    highZones:     zones.filter(z => z.status === 'high').length,
    clearZones:    zones.filter(z => z.status === 'low').length,
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-dot" />
          VenueFlow
        </div>
        <div className="header-center">
          {lastUpdated && (
            <span className="last-updated">
              Live · {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="header-right">
          <span className={`risk-badge risk-${analysis?.analysis?.includes('Critical') ? 'critical' : analysis?.analysis?.includes('High') ? 'high' : 'low'}`}>
            {analysis ? 'AI Active' : 'Connecting...'}
          </span>
        </div>
      </header>

      {/* Alerts Banner */}
      {alerts.length > 0 && <AlertsBanner alerts={alerts} />}

      {/* Stats Bar */}
      <StatsBar stats={stats} loading={loading} />

      {/* Main Grid */}
      <main className="main-grid">
        {/* Map */}
        <section className="map-section">
          <MapView
            zones={zones}
            selectedZone={selectedZone}
            onZoneSelect={setSelectedZone}
          />
        </section>

        {/* Right Panel */}
        <aside className="right-panel">
          <ZonePanel
            zones={zones}
            selectedZone={selectedZone}
            onSelect={setSelectedZone}
            loading={loading}
          />
          <GeminiChat zones={zones} apiUrl={API} />
        </aside>
      </main>

      {/* AI Analysis Footer */}
      {analysis && (
        <div className="analysis-bar">
          <span className="analysis-label">🤖 Gemini Analysis</span>
          <p className="analysis-text">{analysis.analysis?.split('\n')[0]}</p>
        </div>
      )}
    </div>
  )
}
