import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { LatLng } from '../types'
import type { Ranked } from '../model/rank'

const MAX_PINS = 15

export function MapView({ ranked, hotel, onOpen }: { ranked: Ranked[]; hotel: LatLng & { label: string }; onOpen: (id: string) => void }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const open = useRef(onOpen)
  open.current = onOpen

  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, { zoomControl: false, attributionControl: true })
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => { m.remove(); map.current = null }
  }, [])

  useEffect(() => {
    const m = map.current
    const g = layer.current
    if (!m || !g) return
    g.clearLayers()
    const points: L.LatLngExpression[] = [[hotel.latitude, hotel.longitude]]
    L.marker([hotel.latitude, hotel.longitude], {
      icon: L.divIcon({ className: '', html: '<div class="map-pin hotel">H</div>', iconSize: [30, 30], iconAnchor: [15, 15] }),
      title: `Your stay: ${hotel.label}`,
      keyboard: false,
    }).addTo(g)
    // lowest rank first so number 1 ends up on top
    ranked.slice(0, MAX_PINS).map((item, i) => ({ item, i })).reverse().forEach(({ item, i }) => {
      const r = item.restaurant
      const pos: L.LatLngExpression = [r.location.latitude, r.location.longitude]
      points.push(pos)
      L.marker(pos, {
        // a place with no table at the chosen time is a grey pin, still on the map
        icon: L.divIcon({ className: '', html: `<div class="map-pin${i === 0 ? ' top' : ''}${item.unavailable ? ' off' : ''}">${i + 1}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
        title: `${i + 1}. ${r.displayName}${item.booking ? `, ${item.booking.label}` : ''}`,
        alt: `${i + 1}. ${r.displayName}${item.unavailable ? ', no table' : ''}`,
        zIndexOffset: (MAX_PINS - i) * 10,
      }).on('click', () => open.current(r.id)).addTo(g)
    })
    // wait one frame so the container has its final size before fitting
    const t = setTimeout(() => {
      m.invalidateSize()
      m.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 16 })
    }, 60)
    return () => clearTimeout(t)
  }, [ranked, hotel])

  return <div className="map" ref={el} role="application" aria-label={`Map of the top ${Math.min(MAX_PINS, ranked.length)} places`} />
}
