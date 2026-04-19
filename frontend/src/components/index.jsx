// ── ZonePanel ──────────────────────────────────────────────────────
export function ZonePanel({ zones, selectedZone, onSelect, loading }) {
  const sorted = [...zones].sort((a, b) => b.density - a.density)

  return (
    <div className="zone-panel">
      <div className="panel-header">
        <span>Zone Status</span>
        <span className="zone-count">{zones.length} zones</span>
      </div>
      <div className="zone-list">
        {loading
          ? Array(6).fill(0).map((_, i) => <div key={i} className="zone-skeleton" />)
          : sorted.map(zone => (
            <div
              key={zone.zone}
              className={`zone-item zone-${zone.status} ${selectedZone?.zone === zone.zone ? 'zone-selected' : ''}`}
              onClick={() => onSelect(zone)}
              title={`${zone.zone} is currently ${zone.density}% full with a wait time of ~${zone.wait_time} minutes. (${zone.status})`}
            >
              <div className="zone-name">{zone.zone}</div>
              <div className="zone-meta">
                <span className="zone-wait">⏱ {zone.wait_time}m</span>
                <div className="zone-bar-wrap">
                  <div className="zone-bar" style={{ width: `${zone.density}%` }} />
                </div>
                <span className="zone-pct">{zone.density}%</span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

// ── StatsBar ───────────────────────────────────────────────────────
export function StatsBar({ stats, loading }) {
  const items = [
    { label: 'Avg Density',    value: `${stats.avgDensity}%`, icon: '📊', description: 'Average crowd congestion across all zones.' },
    { label: 'Critical Zones', value: stats.criticalZones,    icon: '🔴', description: 'Zones critically overcrowded (above 85% capacity).' },
    { label: 'High Load',      value: stats.highZones,        icon: '🟠', description: 'Zones with heavy foot traffic (70% - 85% capacity).' },
    { label: 'Clear Zones',    value: stats.clearZones,       icon: '🟢', description: 'Zones with low congestion (below 40% capacity).' },
  ]
  return (
    <div className="stats-bar">
      {items.map(item => (
        <div key={item.label} className="stat-card" title={item.description}>
          <span className="stat-icon">{item.icon}</span>
          <span className="stat-value">{loading ? '—' : item.value}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── AlertsBanner ───────────────────────────────────────────────────
export function AlertsBanner({ alerts }) {
  return (
    <div className="alerts-banner">
      <span className="alert-icon">⚠️</span>
      <span className="alert-text">
        OVERCROWDING ALERT:{' '}
        {alerts.map(a => `${a.zone} (${a.density}%)`).join(' · ')}
      </span>
    </div>
  )
}

// ── GeminiChat ─────────────────────────────────────────────────────
import { useState } from 'react'

export function GeminiChat({ zones, apiUrl, height }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m VenueFlow AI. Ask me for navigation help or crowd info.' }
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      // Try navigation-specific endpoint first
      const isNavQuery = /route|go to|how to get|navigate|way to/i.test(userMsg)
      let reply = ''

      if (isNavQuery) {
        const parts = userMsg.match(/from (.+?) to (.+)/i)
        if (parts) {
          const res = await fetch(`${apiUrl}/gemini/navigate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_location: parts[1],
              destination: parts[2],
              zones
            })
          })
          const data = await res.json()
          reply = data.advice
        }
      }

      if (!reply) {
        const res = await fetch(`${apiUrl}/gemini/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMsg,
            context: `Current avg crowd density: ${Math.round(zones.reduce((s,z)=>s+z.density,0)/Math.max(zones.length,1))}%`
          })
        })
        const data = await res.json()
        reply = data.reply
      }

      setMessages(prev => [...prev, { role: 'ai', text: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I couldn\'t connect right now.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gemini-chat" style={{ height: height ? `${height}px` : '260px' }}>
      <div className="chat-header">🤖 VenueFlow AI</div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-msg-${m.role}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="chat-msg chat-msg-ai chat-thinking">Thinking…</div>}
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about routes, wait times…"
        />
        <button className="chat-send" onClick={send} disabled={loading}>→</button>
      </div>
    </div>
  )
}

export default ZonePanel
