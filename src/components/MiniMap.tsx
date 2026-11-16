import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { LatLng, Place } from '../types'

interface Props {
  /** Where the group stays, drawn as the dark "H" pin. */
  stay: Place
  /** The place in focus, drawn as a crimson pin. Without it the map fits the stay and all places. */
  focus?: LatLng
  /** Other places, drawn as small dots. */
  others: LatLng[]
  /** Draw the other places faintly, so the focus stands out. */
  faint?: boolean
  /** Room in px at the bottom for text drawn over the map. */
  bottomInset?: number
  /** Where the map credit sits. */
  credit?: 'topright' | 'bottomright'
  label: string
  className?: string
}

const pin = (cls: string, html: string, size: number) =>
  L.divIcon({ className: '', html: `<div class="${cls}">${html}</div>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })

/** A small map that only shows, it does not pan or zoom. Taps and drags go to whatever sits around it. */
export function MiniMap({ stay, focus, others, faint, bottomInset = 16, credit = 'bottomright', label, className = '' }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, {
      zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false,
      doubleClickZoom: false, boxZoom: false, keyboard: false, zoomSnap: 0.25,
    })
    L.control.attribution({ position: credit, prefix: false }).addTo(m)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => { m.remove(); map.current = null }
  }, [credit])

  const key = JSON.stringify([stay, focus, others, faint, bottomInset])
  useEffect(() => {
    const m = map.current
    const g = layer.current
    if (!m || !g) return
    g.clearLayers()
    for (const o of others)
      L.circleMarker([o.latitude, o.longitude], {
        radius: faint ? 3.5 : 5, stroke: !faint, weight: 1.5, color: '#fff',
        fillColor: '#8b6fe8', fillOpacity: faint ? 0.45 : 0.9, interactive: false,
      }).addTo(g)
    const home: L.LatLngExpression = [stay.latitude, stay.longitude]
    L.marker(home, { icon: pin('map-pin hotel', 'H', 30), interactive: false, keyboard: false }).addTo(g)
    const points: L.LatLngExpression[] = [home]
    if (focus) {
      const at: L.LatLngExpression = [focus.latitude, focus.longitude]
      L.marker(at, { icon: pin('mini-focus', '', 26), interactive: false, keyboard: false, zIndexOffset: 100 }).addTo(g)
      points.push(at)
    } else {
      for (const o of others) points.push([o.latitude, o.longitude])
    }
    // wait one frame so the container has its final size before fitting
    const t = setTimeout(() => {
      m.invalidateSize()
      m.fitBounds(L.latLngBounds(points), {
        paddingTopLeft: [36, 48],
        paddingBottomRight: [36, bottomInset],
        maxZoom: focus ? 16 : 15,
      })
    }, 60)
    return () => clearTimeout(t)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div className={`minimap ${className}`} ref={el} role="img" aria-label={label} />
}
