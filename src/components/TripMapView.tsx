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
}

interface TripMapViewProps {
  activities: ActivityPin[]
  destination: string
}

const TIME_SLOT_COLORS: Record<string, string> = {
  morning: '#f59e0b',
  afternoon: '#e8623a',
  evening: '#8b5cf6',
}

export function TripMapView({ activities, destination }: TripMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [geocodeStatus, setGeocodeStatus] = useState('')
  const [configError, setConfigError] = useState(false)

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

    const activitiesWithLocation = activities.filter(a => a.location)

    const geocodeAndPin = async () => {
      const pinned: { coords: [number, number]; activity: ActivityPin }[] = []
      let done = 0

      // Geocode the destination first to use as proximity bias
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

        let activePopup: mapboxgl.Popup | null = null

        pinned.forEach(({ coords, activity }) => {
          bounds.extend(coords)

          const el = document.createElement('div')
          const color = TIME_SLOT_COLORS[activity.time_slot] || '#e8623a'
          el.style.cssText = `
            width: 26px;
            height: 26px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            background: ${color};
            border: 2px solid rgba(255,255,255,0.25);
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.6);
            transition: transform 0.15s ease;
          `

          el.addEventListener('mouseenter', () => {
            el.style.transform = 'rotate(-45deg) scale(1.2)'
          })
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'rotate(-45deg) scale(1)'
          })

          el.addEventListener('click', (e) => {
            e.stopPropagation()
            if (activePopup) {
              activePopup.remove()
              activePopup = null
            }
            const popup = new mapboxgl.Popup({
              anchor: 'bottom',
              offset: [0, -32],
              closeButton: true,
              closeOnClick: true,
              maxWidth: '240px',
            })
              .setLngLat(coords)
              .setHTML(`
                <div>
                  <div style="font-size:10px;color:#e8623a;text-transform:uppercase;letter-spacing:0.08em;font-family:monospace;margin-bottom:4px;">
                    Day ${activity.day_number} &middot; ${activity.time_slot}
                  </div>
                  <div style="font-size:13px;font-weight:600;color:#f2ede4;line-height:1.3;margin-bottom:4px;">${activity.title}</div>
                  <div style="font-size:11px;color:#b8b0a2;">&#128205; ${activity.location}</div>
                </div>
              `)
              .addTo(map)
            activePopup = popup
            popup.on('close', () => { activePopup = null })
          })

          new mapboxgl.Marker({ element: el })
            .setLngLat(coords)
            .addTo(map)
        })

        map.on('click', () => {
          if (activePopup) {
            activePopup.remove()
            activePopup = null
          }
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
    <div className="relative w-full rounded-xl overflow-hidden border border-[rgba(242,237,228,0.08)]" style={{ height: 520 }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141412]">
          <div className="w-6 h-6 border-2 border-[#e8623a] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-[#b8b0a2]">{geocodeStatus || 'Loading map...'}</p>
        </div>
      )}

      {configError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141412]">
          <p className="text-2xl mb-2">🗺️</p>
          <p className="text-sm text-[#b8b0a2] text-center max-w-xs">
            Add <code className="text-[#e8623a]">NEXT_PUBLIC_MAPBOX_TOKEN</code> to your environment to enable the map view.
          </p>
        </div>
      )}

      {/* Legend */}
      {!loading && !configError && (
        <div className="absolute bottom-3 left-3 flex gap-2">
          {(['morning', 'afternoon', 'evening'] as const).map(slot => (
            <div key={slot} className="flex items-center gap-1.5 bg-[rgba(10,10,9,0.8)] backdrop-blur-sm border border-[rgba(242,237,228,0.08)] rounded-full px-2.5 py-1">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: TIME_SLOT_COLORS[slot] }}
              />
              <span className="text-[10px] text-[#b8b0a2] capitalize font-mono">{slot}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .mapboxgl-popup-content {
          background: #1c1c19 !important;
          border: 1px solid rgba(242,237,228,0.1) !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.6) !important;
          padding: 10px 12px !important;
          font-family: inherit !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: #1c1c19 !important;
          border-bottom-color: #1c1c19 !important;
        }
        .mapboxgl-ctrl-group {
          background: #1c1c19 !important;
          border: 1px solid rgba(242,237,228,0.1) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .mapboxgl-ctrl-group button {
          background-color: transparent !important;
          border-bottom: 1px solid rgba(242,237,228,0.08) !important;
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
