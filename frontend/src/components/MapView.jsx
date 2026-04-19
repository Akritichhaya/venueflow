import { useEffect, useRef } from 'react'

const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY

const STATUS_COLORS = {
  low:      '#00E5A0',
  moderate: '#FFD700',
  high:     '#FF6B35',
  critical: '#FF2D55',
}

export default function MapView({ zones, foodVendors = [], selectedZone, onZoneSelect }) {
  const mapRef     = useRef(null)
  const mapObj     = useRef(null)
  const heatmap    = useRef(null)
  const markers    = useRef([])
  const foodMarkers = useRef([])

  useEffect(() => {
    const initIfReady = () => {
      if (window.google && window.google.maps && window.google.maps.visualization) {
        initMap()
      } else {
        setTimeout(initIfReady, 100)
      }
    }

    if (window.google && window.google.maps) {
      initIfReady()
      return
    }

    let script = document.querySelector('#gmaps-script')
    if (!script) {
      script = document.createElement('script')
      script.id = 'gmaps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=visualization`
      script.async = true
      document.head.appendChild(script)
    }

    script.addEventListener('load', initIfReady)
    return () => script.removeEventListener('load', initIfReady)
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

  // Plot food vendors
  useEffect(() => {
    if (!mapObj.current || !foodVendors.length || !window.google) return

    // Clear old food markers
    foodMarkers.current.forEach(m => m.setMap(null))
    foodMarkers.current = []

    foodVendors.forEach(vendor => {
      if (!vendor.lat || !vendor.lng) return

      const marker = new window.google.maps.Marker({
        position: { lat: vendor.lat, lng: vendor.lng },
        map: mapObj.current,
        title: vendor.name,
        icon: {
          path: 'M 12 2 C 8.134 2 5 5.134 5 9 C 5 14.25 12 22 12 22 C 12 22 19 14.25 19 9 C 19 5.134 15.866 2 12 2 Z',
          scale: 1.5,
          fillColor: '#FFB800',
          fillOpacity: 1,
          strokeColor: '#000',
          strokeWeight: 1,
          anchor: new window.google.maps.Point(12, 22)
        },
        label: {
          text: '🍔',
          fontSize: '14px',
        }
      })

      let menuHtml = vendor.menu.map(item => 
        `<div style="display:flex; justify-content:space-between; margin-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:2px;">
           <span>${item.item}</span>
           <span style="color:#00E5A0; font-weight:bold; margin-left:12px;">${item.price}</span>
         </div>`
      ).join('')

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family:monospace; padding:8px; background:#0E1419; color:#E8F0F7; border-radius:6px; min-width:180px;">
            <strong style="color:#FFB800; font-size:14px;">${vendor.name}</strong><br/>
            <span style="color:#5A7A94; font-size:10px; text-transform:uppercase;">${vendor.type}</span>
            <div style="margin-top:8px; padding-top:8px; border-top:1px solid #1E2A35;">
              ${menuHtml}
            </div>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(mapObj.current, marker)
      })

      foodMarkers.current.push(marker)
    })
  }, [foodVendors])

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
