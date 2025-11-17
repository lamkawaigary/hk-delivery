"use client"
import { useEffect, useState } from 'react'
import { auth, col, db } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import ClientMap from '@/app/(map)/map/ClientMap'

export default function Admin() {
  const [user, setUser] = useState<any>(null)
  const [mode, setMode] = useState<'grab'|'auto'>('grab')
  const [drivers, setDrivers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])

  useEffect(()=>{
    onAuthStateChanged(auth, async (u)=>{
      if (!u) await signInWithPopup(auth, new GoogleAuthProvider())
      setUser(u)
    })
    const unsubDrivers = onSnapshot(col.drivers(), snap=> setDrivers(snap.docs.map(d=>({ id: d.id, ...(d.data() as any) }))))
    const unsubOrders = onSnapshot(col.orders(), snap=> setOrders(snap.docs.map(d=>({ id: d.id, ...(d.data() as any) }))))
    const unsubConfig = onSnapshot(doc(db, 'config', 'dispatch'), d=> {
      const m = (d.data() as any)?.mode
      if (m) setMode(m)
    })
    return ()=>{ unsubDrivers();unsubOrders();unsubConfig() }
  },[])

  const toggleMode = async () => {
    await setDoc(doc(db, 'config', 'dispatch'), { mode: mode==='grab'?'auto':'grab' }, { merge: true })
  }

  return (
    <main className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">後台管理</h2>
      <div className="flex items中心 gap-2">
        <div>派單模式：{mode==='grab'?'搶單':'自動派單'}</div>
        <button className="px-3 py-1 border rounded" onClick={toggleMode}>切換模式</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <section className="border rounded p-2">
          <h3 className="font-medium">司機</h3>
          {drivers.map(d=> (
            <div key={d.id} className="text-sm">{d.id} {d.status} {d.location?`${d.location.latitude.toFixed(5)},${d.location.longitude.toFixed(5)}`:''}</div>
          ))}
        </section>
        <section className="border rounded p-2">
          <h3 className="font-medium">訂單</h3>
          {orders.map(o=> (
            <div key={o.id} className="text-sm">{o.id} {o.status} ${o.amount}</div>
          ))}
        </section>
        <section className="md:col-span-2">
          <ClientMap drivers={drivers} />
        </section>
      </div>
    </main>
  )
}
