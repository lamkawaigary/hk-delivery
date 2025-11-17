"use client"
import { useEffect, useRef } from 'react'

export default function ClientMap({ drivers }: { drivers: { id:string, location?: { latitude:number, longitude:number } }[] }) {
  const ref = useRef<HTMLDivElement|null>(null)
  useEffect(()=>{
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`
    script.async = true
    document.head.appendChild(script)
    script.onload = ()=>{
      // @ts-ignore
      const map = new google.maps.Map(ref.current!, { center: { lat: 22.3193, lng: 114.1694 }, zoom: 12 })
      drivers.forEach(d=>{
        if (!d.location) return
        // @ts-ignore
        new google.maps.Marker({ position: { lat: d.location.latitude, lng: d.location.longitude }, map })
      })
    }
    return ()=>{ document.head.removeChild(script) }
  }, [drivers])
  return <div ref={ref} className="w-full h-80 border rounded" />
}
