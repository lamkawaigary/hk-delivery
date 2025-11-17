"use client"
import { useEffect, useMemo, useState } from 'react'
import { auth, col, db, docRef } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { addDoc, onSnapshot, query, where, updateDoc, serverTimestamp, GeoPoint } from 'firebase/firestore'

type Product = { id: string, name: string, price: number, storeId: string, stock: number }

export default function UserApp() {
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<Record<string, number>>({})
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(()=>{
    const unsubAuth = onAuthStateChanged(auth, setUser)
    const unsub = onSnapshot(col.products(), (snap)=>{
      setProducts(snap.docs.map(d=>({ id: d.id, ...(d.data() as any) })))
    })
    return ()=>{unsub();unsubAuth()}
  },[])

  const total = useMemo(()=>products.reduce((sum,p)=> sum + (cart[p.id]||0)*p.price, 0),[products,cart])

  const checkout = async () => {
    if (!user) {
      await signInWithPopup(auth, new GoogleAuthProvider())
    }
    const items = Object.entries(cart).filter(([pid,qty])=>qty>0).map(([pid,qty])=>{
      const p = products.find(pp=>pp.id===pid)!
      return { productId: pid, qty, price: p.price, storeId: p.storeId }
    })
    const pickup = new GeoPoint(22.3080, 114.1600)
    await addDoc(col.orders(), {
      userId: user?.uid,
      items,
      amount: total,
      created_at: serverTimestamp(),
      status: 'pending',
      pickup_location: pickup,
      delivery_address: address,
      user_phone: phone
    })
    setCart({})
    alert('已下單')
  }

  return (
    <main className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">用戶端</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {products.map(p=> (
          <div key={p.id} className="border rounded p-3">
            <div className="font-medium">{p.name}</div>
            <div>${p.price}</div>
            <div>庫存：{p.stock}</div>
            <div className="flex items-center gap-2 mt-2">
              <button className="px-2 py-1 border" onClick={()=>setCart(c=>({ ...c, [p.id]: Math.max(0,(c[p.id]||0)-1) }))}>-</button>
              <span>{cart[p.id]||0}</span>
              <button className="px-2 py-1 border" onClick={()=>setCart(c=>({ ...c, [p.id]: (c[p.id]||0)+1 }))}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <input className="w-full p-2 border rounded" placeholder="送貨地址" value={address} onChange={e=>setAddress(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="電話" value={phone} onChange={e=>setPhone(e.target.value)} />
        <div>總額：${total}</div>
        <button className="px-4 py-2 bg-brand text-white rounded" onClick={checkout}>一鍵下單</button>
      </div>
    </main>
  )
}
