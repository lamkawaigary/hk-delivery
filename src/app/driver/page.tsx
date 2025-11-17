"use client"
import { useEffect, useRef, useState } from 'react'
import { auth, col, docRef, messagingPromise } from '@/lib/firebase'
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { onSnapshot, updateDoc, serverTimestamp, writeBatch, GeoPoint, getFirestore } from 'firebase/firestore'

type Mode = 'grab' | 'auto'

export default function DriverApp() {
  const [user, setUser] = useState<any>(null)
  const [mode, setMode] = useState<Mode>('grab')
  const [orders, setOrders] = useState<any[]>([])
  const [coords, setCoords] = useState<GeolocationCoordinates|null>(null)
  const wakeLock = useRef<any>(null)

  useEffect(()=>{
    const unsubAuth = onAuthStateChanged(auth, async (u)=>{
      if (!u) await signInWithPopup(auth, new GoogleAuthProvider())
      setUser(u)
    })
    const unsubOrders = onSnapshot(col.orders(), (snap)=>{
      setOrders(snap.docs.map(d=>({ id: d.id, ...(d.data() as any) })))
    })
    const watchId = navigator.geolocation.watchPosition((pos)=>{
      setCoords(pos.coords)
    })
    const lock = async () => {
      try { wakeLock.current = await (navigator as any).wakeLock?.request('screen') } catch {}
    }
    lock()
    const interval = setInterval(async ()=>{
      if (user && coords) await updateDoc(docRef.driver(user.uid), { location: new GeoPoint(coords.latitude, coords.longitude), status: 'online', updated_at: serverTimestamp() })
    }, 8000)
    messagingPromise.then(async (msg)=>{
      if (!msg) return
      try {
        const { getToken } = await import('firebase/messaging')
        await getToken(msg, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY })
      } catch {}
    })
    return ()=>{ unsubAuth();unsubOrders(); clearInterval(interval); navigator.geolocation.clearWatch(watchId); wakeLock.current?.release?.() }
  },[user, coords])

  const acceptOrder = async (orderId: string) => {
    const batch = writeBatch(getFirestore())
    batch.update(docRef.order(orderId), { assigned_driver: user.uid, status: 'assigned' })
    await batch.commit()
  }

  const navToPickup = (order: any) => {
    const { pickup_location } = order
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pickup_location.latitude},${pickup_location.longitude}`
    window.open(url, '_blank')
  }

  return (
    <main className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">司機端</h2>
      <div className="flex gap-2">
        <button className={`px-3 py-1 border rounded ${mode==='grab'?'bg-brand text-white':''}`} onClick={()=>setMode('grab')}>搶單模式</button>
        <button className={`px-3 py-1 border rounded ${mode==='auto'?'bg-brand text-white':''}`} onClick={()=>setMode('auto')}>自動派單模式</button>
      </div>
      <div className="space-y-2">
        {orders.filter(o=>o.status==='pending' || o.status==='assigned').map(o=> (
          <div key={o.id} className="border rounded p-2">
            <div>金額 ${o.amount} 電話 {o.user_phone}</div>
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 border" onClick={()=>acceptOrder(o.id)}>接單</button>
              <button className="px-3 py-1 border" onClick={()=>navToPickup(o)}>導航</button>
              <button className="px-3 py-1 border" onClick={()=>updateDoc(docRef.order(o.id), { status: 'picked' })}>已取貨</button>
              <button className="px-3 py-1 border" onClick={()=>updateDoc(docRef.order(o.id), { status: 'delivered' })}>已送達</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
