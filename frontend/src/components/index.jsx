// ── ZonePanel ──────────────────────────────────────────────────────
export function ZonePanel({ zones, selectedZone, onSelect, loading }) {
  const sorted = [...zones].sort((a, b) => b.density - a.density)

  return (
    <div className="zone-panel" role="region" aria-label="Zone Status Panel">
      <div className="panel-header">
        <span>Zone Status</span>
        <span className="zone-count" aria-label={`${zones.length} zones monitored`}>{zones.length} zones</span>
      </div>
      <div className="zone-list" role="list" aria-label="Venue zones sorted by crowd density">
        {loading
          ? Array(6).fill(0).map((_, i) => (
            <div key={i} className="zone-skeleton" role="status" aria-label="Loading zone data" />
          ))
          : sorted.map(zone => (
            <div
              key={zone.zone}
              className={`zone-item zone-${zone.status} ${selectedZone?.zone === zone.zone ? 'zone-selected' : ''}`}
              onClick={() => onSelect(zone)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(zone)}
              role="button"
              tabIndex={0}
              aria-label={`${zone.zone}: ${zone.density}% full, ${zone.wait_time} minute wait, status ${zone.status}`}
              aria-pressed={selectedZone?.zone === zone.zone}
            >
              <div className="zone-name">{zone.zone}</div>
              <div className="zone-meta">
                <span className="zone-wait" aria-label={`${zone.wait_time} minute wait`}>⏱ {zone.wait_time}m</span>
                <div className="zone-bar-wrap" role="progressbar" aria-valuenow={zone.density} aria-valuemin={0} aria-valuemax={100} aria-label={`${zone.density}% capacity`}>
                  <div className="zone-bar" style={{ width: `${zone.density}%` }} />
                </div>
                <span className="zone-pct" aria-hidden="true">{zone.density}%</span>
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
    { label: 'AVG DENSITY', value: `${stats.avgDensity}%`, icon: '📊', description: `Average crowd density is ${stats.avgDensity}%` },
    { label: 'CRITICAL ZONES', value: stats.criticalZones, icon: '🔴', description: `${stats.criticalZones} zones at critical capacity` },
    { label: 'HIGH LOAD', value: stats.highZones, icon: '🟠', description: `${stats.highZones} zones at high load` },
    { label: 'CLEAR ZONES', value: stats.clearZones, icon: '🟢', description: `${stats.clearZones} zones are clear` },
  ]
  return (
    <div className="stats-bar" role="region" aria-label="Venue Statistics">
      {items.map(item => (
        <div key={item.label} className="stat-card" aria-label={item.description}>
          <span className="stat-icon" aria-hidden="true">{item.icon}</span>
          <span className="stat-value" aria-live="polite">{loading ? '—' : item.value}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── AlertsBanner ───────────────────────────────────────────────────
export function AlertsBanner({ alerts }) {
  return (
    <div className="alerts-banner" role="alert" aria-live="assertive" aria-label="Overcrowding Alert">
      <span className="alert-icon" aria-hidden="true">⚠️</span>
      <span className="alert-text">
        OVERCROWDING ALERT:{' '}
        {alerts.map(a => `${a.zone} (${a.density}%)`).join(' · ')}
      </span>
    </div>
  )
}

// ── GeminiChat ─────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'

export function GeminiChat({ zones, apiUrl }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m VenueFlow AI. Ask me for navigation help or crowd info.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const isNavQuery = /route|go to|how to get|navigate|way to/i.test(userMsg)
      let reply = ''

      if (isNavQuery) {
        const parts = userMsg.match(/from (.+?) to (.+)/i)
        if (parts) {
          const res = await fetch(`${apiUrl}/gemini/navigate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_location: parts[1], destination: parts[2], zones })
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
            context: `Current avg crowd density: ${Math.round(zones.reduce((s, z) => s + z.density, 0) / Math.max(zones.length, 1))}%`
          })
        })
        const data = await res.json()
        reply = data.reply
      }

      setMessages(prev => [...prev, { role: 'ai', text: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'AI is temporarily unavailable. Please check the Zone Status panel for live crowd info!' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gemini-chat" role="region" aria-label="VenueFlow AI Assistant">
      <div className="chat-header" aria-label="AI Chat Header">🤖 VENUEFLOW AI</div>
      <div
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        aria-relevant="additions"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-msg chat-msg-${m.role}`}
            role={m.role === 'ai' ? 'status' : 'none'}
            aria-label={m.role === 'ai' ? `AI says: ${m.text}` : `You said: ${m.text}`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="chat-msg chat-msg-ai chat-thinking" role="status" aria-label="AI is thinking">
            Thinking…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-row" role="form" aria-label="Send message to AI">
        <label htmlFor="chat-input" className="sr-only">Ask VenueFlow AI a question</label>
        <input
          id="chat-input"
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about routes, wait times…"
          aria-label="Type your question here"
          disabled={loading}
        />
        <button
          className="chat-send"
          onClick={send}
          disabled={loading}
          aria-label="Send message"
          title="Send message"
        >
          →
        </button>
      </div>
    </div>
  )
}

export default ZonePanel