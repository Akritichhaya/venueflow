import { useEffect, useRef } from 'react'

const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY

const STATUS_COLORS = {
  low:      '#00E5A0',
  moderate: '#FFD700',
  high:     '#FF6B35',
  critical: '#FF2D55',
}

export default function MapView({ zones, selectedZone, onZoneSelect }) {
  const mapRef     = useRef(null)
  const mapObj     = useRef(null)
  const heatmap    = useRef(null)
  const markers    = useRef([])

  // Load Google Maps script once
  useEffect(() => {
    if (window.google) { initMap(); return }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=visualization`
    script.async = true
    script.onload = initMap
    document.head.appendChild(script)
  }, [])

  function initMap() {
    if (!mapRef.current || mapObj.current) return
    mapObj.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 12.9784, lng: 77.5915 },
      zoom: 16,
      mapTypeId: 'satellite',
      styles: darkMapStyles,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
    })
  }

  // Update heatmap when zones change
  useEffect(() => {
    if (!mapObj.current || !zones.length || !window.google) return

    // Clear old heatmap
    if (heatmap.current) heatmap.current.setMap(null)

    const points = zones
      .filter(z => z.lat && z.lng)
      .map(z => ({
        location: new window.google.maps.LatLng(z.lat, z.lng),
        weight: z.density / 100
      }))

    heatmap.current = new window.google.maps.visualization.HeatmapLayer({
      data: points,
      map: mapObj.current,
      radius: 40,
      opacity: 0.7,
      gradient: [
        'rgba(0,229,160,0)',
        'rgba(0,229,160,0.8)',
        'rgba(255,215,0,0.8)',
        'rgba(255,107,53,0.9)',
        'rgba(255,45,85,1)',
      ]
    })

    // Clear old markers
    markers.current.forEach(m => m.setMap(null))
    markers.current = []

    // Add zone markers
    zones.forEach(zone => {
      if (!zone.lat || !zone.lng) return
      const color = STATUS_COLORS[zone.status] || '#fff'

      const marker = new window.google.maps.Marker({
        position: { lat: zone.lat, lng: zone.lng },
        map: mapObj.current,
        title: zone.zone,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 0.95,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        label: {
          text: `${zone.density}%`,
          color: '#000',
          fontSize: '10px',
          fontWeight: 'bold',
        }
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family:monospace;padding:8px;background:#0E1419;color:#E8F0F7;border-radius:6px">
            <strong style="color:${color}">${zone.zone}</strong><br/>
            Density: ${zone.density}%<br/>
            Wait: ~${zone.wait_time} min<br/>
            Status: <span style="color:${color}">${zone.status.toUpperCase()}</span>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(mapObj.current, marker)
        onZoneSelect(zone)
      })

      markers.current.push(marker)
    })
  }, [zones])

  // Pan to selected zone
  useEffect(() => {
    if (!mapObj.current || !selectedZone?.lat) return
    mapObj.current.panTo({ lat: selectedZone.lat, lng: selectedZone.lng })
    mapObj.current.setZoom(18)
  }, [selectedZone])

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#0e1419' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e1419' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5a7a94' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2a35' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#070b0f' }] },
]
