"use client"
import { useEffect, useState } from 'react'
import { auth, col, storage, docRef } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { addDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function StoreApp() {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number>(100)
  const [stock, setStock] = useState<number>(10)
  const [imageFile, setImageFile] = useState<File|null>(null)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(()=>{
    const unsubAuth = onAuthStateChanged(auth, async (u)=>{
      if (!u) await signInWithPopup(auth, new GoogleAuthProvider())
      setUser(u)
    })
    const unsubOrders = onSnapshot(col.orders(), (snap)=>{
      setOrders(snap.docs.map(d=>({ id: d.id, ...(d.data() as any) })))
    })
    return ()=>{unsubAuth();unsubOrders()}
  },[])

  const uploadProduct = async () => {
    if (!user || !imageFile) return
    const imageRef = ref(storage, `products/${user.uid}/${Date.now()}_${imageFile.name}`)
    await uploadBytes(imageRef, imageFile)
    const url = await getDownloadURL(imageRef)
    await addDoc(col.products(), { name, price, stock, storeId: user.uid, image: url, created_at: serverTimestamp() })
    setName(''); setPrice(100); setStock(10); setImageFile(null)
    alert('商品已上傳')
  }

  const markPrepared = async (orderId: string) => {
    await updateDoc(docRef.order(orderId), { status: 'assigned' })
  }

  return (
    <main className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">商店端</h2>
      <div className="grid gap-2">
        <input className="p-2 border rounded" placeholder="商品名稱" value={name} onChange={e=>setName(e.target.value)} />
        <input className="p-2 border rounded" type="number" placeholder="價格" value={price} onChange={e=>setPrice(Number(e.target.value))} />
        <input className="p-2 border rounded" type="number" placeholder="庫存" value={stock} onChange={e=>setStock(Number(e.target.value))} />
        <input className="p-2 border rounded" type="file" onChange={e=>setImageFile(e.target.files?.[0]||null)} />
        <button className="px-4 py-2 bg-brand text-white rounded" onClick={uploadProduct}>上傳商品</button>
      </div>
      <div>
        <h3 className="font-medium">新訂單</h3>
        <div className="space-y-2">
          {orders.filter(o=>o.status==='pending').map(o=> (
            <div key={o.id} className="border rounded p-2 flex items-center justify-between">
              <div>金額 ${o.amount}，地址 {o.delivery_address}</div>
              <button className="px-3 py-1 border" onClick={()=>markPrepared(o.id)}>已備貨</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
