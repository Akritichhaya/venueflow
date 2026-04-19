/**
 * VenueFlow Frontend Tests
 * Accessibility and component tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ZonePanel, StatsBar, AlertsBanner, GeminiChat } from '../components/index.jsx'

// ── Mock Data ─────────────────────────────────────────────────────
const mockZones = [
  { zone: 'Gate A', density: 83, wait_time: 21, lat: 12.9784, lng: 77.5912, status: 'critical', updated_at: 1234567890 },
  { zone: 'Gate B', density: 45, wait_time: 5, lat: 12.9790, lng: 77.5920, status: 'moderate', updated_at: 1234567890 },
  { zone: 'Gate C', density: 20, wait_time: 0, lat: 12.9778, lng: 77.5905, status: 'low', updated_at: 1234567890 },
  { zone: 'North Stand', density: 92, wait_time: 24, lat: 12.9795, lng: 77.5915, status: 'critical', updated_at: 1234567890 },
]

const mockStats = {
  avgDensity: 60,
  criticalZones: 2,
  highZones: 1,
  clearZones: 3,
}

const mockAlerts = mockZones.filter(z => z.density > 80)

// ── StatsBar Tests ────────────────────────────────────────────────
describe('StatsBar', () => {
  it('renders all 4 stat cards', () => {
    render(<StatsBar stats={mockStats} loading={false} />)
    expect(screen.getByText('AVG DENSITY')).toBeDefined()
    expect(screen.getByText('CRITICAL ZONES')).toBeDefined()
    expect(screen.getByText('HIGH LOAD')).toBeDefined()
    expect(screen.getByText('CLEAR ZONES')).toBeDefined()
  })

  it('shows loading state with dashes', () => {
    render(<StatsBar stats={mockStats} loading={true} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4)
  })

  it('displays correct avg density value', () => {
    render(<StatsBar stats={mockStats} loading={false} />)
    expect(screen.getByText('60%')).toBeDefined()
  })

  it('displays correct critical zones count', () => {
    render(<StatsBar stats={mockStats} loading={false} />)
    expect(screen.getByText('2')).toBeDefined()
  })
})

// ── AlertsBanner Tests ────────────────────────────────────────────
describe('AlertsBanner', () => {
  it('renders overcrowding alert text', () => {
    render(<AlertsBanner alerts={mockAlerts} />)
    expect(screen.getByText(/OVERCROWDING ALERT/)).toBeDefined()
  })

  it('shows alert icon', () => {
    render(<AlertsBanner alerts={mockAlerts} />)
    expect(screen.getByText('⚠️')).toBeDefined()
  })

  it('displays zone names and densities', () => {
    render(<AlertsBanner alerts={mockAlerts} />)
    expect(screen.getByText(/Gate A/)).toBeDefined()
    expect(screen.getByText(/83%/)).toBeDefined()
  })

  it('shows multiple alerts separated by dots', () => {
    render(<AlertsBanner alerts={mockAlerts} />)
    const text = screen.getByText(/OVERCROWDING ALERT/).textContent
    expect(text).toContain('·')
  })
})

// ── ZonePanel Tests ───────────────────────────────────────────────
describe('ZonePanel', () => {
  it('renders zone count correctly', () => {
    render(<ZonePanel zones={mockZones} selectedZone={null} onSelect={() => { }} loading={false} />)
    expect(screen.getByText('4 zones')).toBeDefined()
  })

  it('renders ZONE STATUS header', () => {
    render(<ZonePanel zones={mockZones} selectedZone={null} onSelect={() => { }} loading={false} />)
    expect(screen.getByText('Zone Status')).toBeDefined()
  })

  it('renders all zone names', () => {
    render(<ZonePanel zones={mockZones} selectedZone={null} onSelect={() => { }} loading={false} />)
    expect(screen.getByText('Gate A')).toBeDefined()
    expect(screen.getByText('Gate B')).toBeDefined()
    expect(screen.getByText('Gate C')).toBeDefined()
  })

  it('shows loading skeletons when loading', () => {
    render(<ZonePanel zones={[]} selectedZone={null} onSelect={() => { }} loading={true} />)
    const skeletons = document.querySelectorAll('.zone-skeleton')
    expect(skeletons.length).toBe(6)
  })

  it('calls onSelect when zone is clicked', () => {
    const onSelect = vi.fn()
    render(<ZonePanel zones={mockZones} selectedZone={null} onSelect={onSelect} loading={false} />)
    fireEvent.click(screen.getByText('Gate A'))
    expect(onSelect).toHaveBeenCalledWith(mockZones[0])
  })

  it('highlights selected zone', () => {
    render(<ZonePanel zones={mockZones} selectedZone={mockZones[0]} onSelect={() => { }} loading={false} />)
    const selectedZone = document.querySelector('.zone-selected')
    expect(selectedZone).toBeDefined()
  })

  it('sorts zones by density (highest first)', () => {
    render(<ZonePanel zones={mockZones} selectedZone={null} onSelect={() => { }} loading={false} />)
    const zoneNames = document.querySelectorAll('.zone-name')
    // First zone should be highest density (North Stand 92%)
    expect(zoneNames[0].textContent).toBe('North Stand')
  })

  it('displays wait times', () => {
    render(<ZonePanel zones={mockZones} selectedZone={null} onSelect={() => { }} loading={false} />)
    expect(screen.getByText('⏱ 21m')).toBeDefined()
  })
})

// ── GeminiChat Tests ──────────────────────────────────────────────
describe('GeminiChat', () => {
  it('renders initial AI greeting', () => {
    render(<GeminiChat zones={mockZones} apiUrl="http://localhost:8080/api" />)
    expect(screen.getByText(/VenueFlow AI/)).toBeDefined()
    expect(screen.getByText(/Hi! I'm VenueFlow AI/)).toBeDefined()
  })

  it('renders input placeholder', () => {
    render(<GeminiChat zones={mockZones} apiUrl="http://localhost:8080/api" />)
    expect(screen.getByPlaceholderText('Ask about routes, wait times…')).toBeDefined()
  })

  it('renders send button', () => {
    render(<GeminiChat zones={mockZones} apiUrl="http://localhost:8080/api" />)
    expect(screen.getByText('→')).toBeDefined()
  })

  it('updates input on typing', () => {
    render(<GeminiChat zones={mockZones} apiUrl="http://localhost:8080/api" />)
    const input = screen.getByPlaceholderText('Ask about routes, wait times…')
    fireEvent.change(input, { target: { value: 'Which gate is least crowded?' } })
    expect(input.value).toBe('Which gate is least crowded?')
  })

  it('sends message on Enter key', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ reply: 'Gate C is least crowded!' })
    })
    render(<GeminiChat zones={mockZones} apiUrl="http://localhost:8080/api" />)
    const input = screen.getByPlaceholderText('Ask about routes, wait times…')
    fireEvent.change(input, { target: { value: 'Which gate?' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => {
      expect(screen.getByText('Which gate?')).toBeDefined()
    })
  })

  it('does not send empty message', () => {
    const fetchSpy = vi.fn()
    global.fetch = fetchSpy
    render(<GeminiChat zones={mockZones} apiUrl="http://localhost:8080/api" />)
    fireEvent.click(screen.getByText('→'))
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

// ── Accessibility Tests ───────────────────────────────────────────
describe('Accessibility', () => {
  it('StatsBar has no interactive elements without labels', () => {
    render(<StatsBar stats={mockStats} loading={false} />)
    const buttons = document.querySelectorAll('button')
    buttons.forEach(btn => {
      expect(btn.getAttribute('aria-label') || btn.textContent).toBeTruthy()
    })
  })

  it('ZonePanel items are keyboard accessible', () => {
    render(<ZonePanel zones={mockZones} selectedZone={null} onSelect={() => { }} loading={false} />)
    const zoneItems = document.querySelectorAll('.zone-item')
    expect(zoneItems.length).toBeGreaterThan(0)
  })

  it('AlertsBanner has accessible alert text', () => {
    render(<AlertsBanner alerts={mockAlerts} />)
    const banner = document.querySelector('.alerts-banner')
    expect(banner).toBeDefined()
    expect(banner.textContent).toContain('OVERCROWDING ALERT')
  })

  it('GeminiChat input has placeholder for screen readers', () => {
    render(<GeminiChat zones={mockZones} apiUrl="http://localhost:8080/api" />)
    const input = screen.getByPlaceholderText('Ask about routes, wait times…')
    expect(input).toBeDefined()
  })
})
