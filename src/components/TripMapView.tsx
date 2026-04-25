'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

export interface ActivityPin {
  id: string
  title: string
  time_slot: string
  location: string
  day_number: number
  category: string
  description?: string
}

interface TripMapViewProps {
  activities: ActivityPin[]
  destination: string
  onActivityClick?: (activityId: string) => void
}

const TIME_SLOT_COLORS: Record<string, string> = {
  morning: '#f59e0b',
  afternoon: '#C0543A',
  evening: '#8b5cf6',
}

export function TripMapView({ activities, destination, onActivityClick }: TripMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const justClickedMarker = useRef(false)
  const onActivityClickRef = useRef(onActivityClick)

  const [loading, setLoading] = useState(true)
  const [geocodeStatus, setGeocodeStatus] = useState('')
  const [configError, setConfigError] = useState(false)
  const [selectedPin, setSelectedPin] = useState<ActivityPin | null>(null)

  useEffect(() => {
    onActivityClickRef.current = onActivityClick
  }, [onActivityClick])

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setConfigError(true)
      setLoading(false)
      return
    }

    if (!mapContainer.current || mapRef.current) return

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: 1,
    })

    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Close preview when clicking map background
    map.on('click', () => {
      if (justClickedMarker.current) return
      setSelectedPin(null)
    })

    const activitiesWithLocation = activities.filter(a => a.location)

    const geocodeAndPin = async () => {
      const pinned: { coords: [number, number]; activity: ActivityPin }[] = []
      let done = 0

      let proximityParam = ''
      try {
        const destRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${token}&limit=1`
        )
        const destData = await destRes.json()
        if (destData.features?.length > 0) {
          const [lng, lat] = destData.features[0].center
          proximityParam = `&proximity=${lng},${lat}`
        }
      } catch {
        // fall back to no proximity hint
      }

      for (const activity of activitiesWithLocation) {
        setGeocodeStatus(`Locating ${done + 1} of ${activitiesWithLocation.length}...`)
        try {
          const query = encodeURIComponent(`${activity.location}, ${destination}`)
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1${proximityParam}`
          )
          const data = await res.json()
          if (data.features?.length > 0) {
            const [lng, lat] = data.features[0].center
            pinned.push({ coords: [lng, lat], activity })
          }
        } catch {
          // skip failed geocode
        }
        done++
      }

      if (pinned.length === 0) {
        setLoading(false)
        return
      }

      const addMarkersToMap = () => {
        const bounds = new mapboxgl.LngLatBounds()

        pinned.forEach(({ coords, activity }) => {
          bounds.extend(coords)

          // Wrapper: Mapbox owns this element's transform for positioning
          const wrapper = document.createElement('div')

          // Pin: we own this element's transform for rotation/scale
          const pin = document.createElement('div')
          const color = TIME_SLOT_COLORS[activity.time_slot] || '#C0543A'
          pin.style.cssText = `
            width: 26px;
            height: 26px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg) scale(1);
            background: ${color};
            border: 2px solid rgba(255,255,255,0.25);
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.6);
            transition: transform 0.15s, box-shadow 0.15s;
          `

          pin.addEventListener('mouseenter', () => {
            pin.style.transform = 'rotate(-45deg) scale(1.2)'
            pin.style.boxShadow = '0 4px 16px rgba(0,0,0,0.7)'
          })
          pin.addEventListener('mouseleave', () => {
            pin.style.transform = 'rotate(-45deg) scale(1)'
            pin.style.boxShadow = '0 2px 8px rgba(0,0,0,0.6)'
          })

          wrapper.addEventListener('click', (e) => {
            e.stopPropagation()
            justClickedMarker.current = true
            setSelectedPin(prev => prev?.id === activity.id ? null : activity)
            setTimeout(() => { justClickedMarker.current = false }, 50)
          })

          wrapper.appendChild(pin)

          new mapboxgl.Marker({ element: wrapper })
            .setLngLat(coords)
            .addTo(map)
        })

        if (pinned.length === 1) {
          map.flyTo({ center: pinned[0].coords, zoom: 14 })
        } else {
          map.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 800 })
        }

        setLoading(false)
      }

      if (map.isStyleLoaded()) {
        addMarkersToMap()
      } else {
        map.once('load', addMarkersToMap)
      }
    }

    geocodeAndPin()

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border h-[300px] sm:h-[520px]">
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{geocodeStatus || 'Loading map...'}</p>
        </div>
      )}

      {configError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface">
          <p className="text-2xl mb-2">🗺️</p>
          <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-secondary)' }}>
            Add <code style={{ color: 'var(--accent)' }}>NEXT_PUBLIC_MAPBOX_TOKEN</code> to your environment to enable the map view.
          </p>
        </div>
      )}

      {/* Pin preview card */}
      {selectedPin && !loading && (
        <div
          className="absolute bottom-14 left-3 right-3 sm:left-auto sm:right-3 sm:w-72"
          style={{
            background: 'var(--background)',
            border: '0.5px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 16px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            zIndex: 10,
          }}
        >
          {/* Close */}
          <button
            onClick={() => setSelectedPin(null)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
              color: 'var(--text-muted)',
              padding: '2px 4px',
            }}
          >
            ×
          </button>

          {/* Day + slot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: TIME_SLOT_COLORS[selectedPin.time_slot] || 'var(--accent)',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '10px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Day {selectedPin.day_number} · {selectedPin.time_slot}
            </span>
          </div>

          {/* Title */}
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px', lineHeight: '1.3', paddingRight: '20px' }}>
            {selectedPin.title}
          </p>

          {/* Location */}
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: selectedPin.description ? '8px' : '14px' }}>
            {selectedPin.location}
          </p>

          {/* Description snippet */}
          {selectedPin.description && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {selectedPin.description}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={() => {
              onActivityClickRef.current?.(selectedPin.id)
              setSelectedPin(null)
            }}
            style={{
              width: '100%',
              background: 'var(--text-primary)',
              color: 'var(--background)',
              border: 'none',
              borderRadius: '8px',
              padding: '9px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            View in itinerary →
          </button>
        </div>
      )}

      {/* Legend */}
      {!loading && !configError && (
        <div className="absolute bottom-3 left-3 flex gap-2">
          {(['morning', 'afternoon', 'evening'] as const).map(slot => (
            <div key={slot} className="flex items-center gap-1.5 backdrop-blur-sm rounded-full px-2.5 py-1" style={{ background: 'var(--background)', border: '0.5px solid var(--border)', opacity: 0.92 }}>
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: TIME_SLOT_COLORS[slot] }}
              />
              <span className="text-[10px] capitalize font-mono" style={{ color: 'var(--text-secondary)' }}>{slot}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .mapboxgl-ctrl-group {
          background: var(--surface) !important;
          border: 0.5px solid var(--border) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .mapboxgl-ctrl-group button {
          background-color: transparent !important;
          border-bottom: 0.5px solid var(--border) !important;
        }
        .mapboxgl-ctrl-group button:last-child {
          border-bottom: none !important;
        }
        .mapboxgl-ctrl-icon {
          filter: invert(0.8) !important;
        }
      `}</style>
    </div>
  )
}
