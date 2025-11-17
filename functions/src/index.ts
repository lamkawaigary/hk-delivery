import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

admin.initializeApp()
const db = admin.firestore()

export const onOrderCreated = functions.region('asia-east2').firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, ctx) => {
    const order = snap.data() as any
    const cfgSnap = await db.doc('config/dispatch').get()
    const mode = (cfgSnap.data()?.mode) || 'grab'

    const driversSnap = await db.collection('drivers').where('status','==','online').get()
    const drivers = driversSnap.docs.map(d=>({ id: d.id, ...(d.data() as any) }))
    const within5km = drivers.filter(d=>{
      if (!d.location) return false
      const km = distanceKm({ lat: d.location.latitude, lng: d.location.longitude }, { lat: order.pickup_location.latitude, lng: order.pickup_location.longitude })
      return km <= 5
    })

    if (mode === 'grab') {
      await broadcastNewOrder(within5km, order)
      await snap.ref.update({ status: 'pending', candidate_drivers: within5km.map(d=>d.id), expires_at: admin.firestore.Timestamp.fromDate(new Date(Date.now()+30000)) })
    } else {
      const sorted = within5km.sort((a,b)=>{
        const da = distanceKm(loc(a.location), loc(order.pickup_location))
        const dbb = distanceKm(loc(b.location), loc(order.pickup_location))
        if (da!==dbb) return da - dbb
        const ia = a.last_idle_at? a.last_idle_at.toMillis():0
        const ib = b.last_idle_at? b.last_idle_at.toMillis():0
        if (ia!==ib) return ia - ib
        const ra = a.rating || 0
        const rb = b.rating || 0
        return rb - ra
      })
      for (const d of sorted) {
        await snap.ref.update({ status: 'pending', candidate_drivers: [d.id] })
        await sendFCM(d.id, order)
        await waitMs(5000)
        const fresh = await snap.ref.get()
        const assigned = fresh.data()?.assigned_driver
        if (assigned) break
      }
      const fresh = await snap.ref.get()
      if (!fresh.data()?.assigned_driver) {
        await broadcastNewOrder(sorted, order)
      }
    }
  })

export const onOrderTimeout = functions.region('asia-east2').pubsub.schedule('every 1 minutes').onRun(async ()=>{
  const now = admin.firestore.Timestamp.now()
  const q = await db.collection('orders').where('status','==','pending').where('expires_at','<=',now).get()
  for (const doc of q.docs) {
    await doc.ref.update({ status: 'pending', assigned_driver: admin.firestore.FieldValue.delete(), candidate_drivers: [] })
    const order = doc.data()
    const driversSnap = await db.collection('drivers').where('status','==','online').get()
    await broadcastNewOrder(driversSnap.docs.map(d=>({ id: d.id, ...(d.data() as any) })), order)
  }
})

export const updateDriverLocation = functions.region('asia-east2').https.onCall(async (data, context)=>{
  const uid = context.auth?.uid
  if (!uid) throw new functions.https.HttpsError('unauthenticated','must login')
  const { lat, lng, vehicle_type } = data
  await db.doc(`drivers/${uid}`).set({ location: new admin.firestore.GeoPoint(lat,lng), status: 'online', vehicle_type, updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
  return { ok: true }
})

async function broadcastNewOrder(drivers: any[], order: any) {
  const title = `新訂單 $${order.amount}`
  const body = `${order.delivery_address} 電話 ${order.user_phone}`
  const tokensSnap = await Promise.all(drivers.map(d=> db.collection('driver_tokens').doc(d.id).get()))
  const tokens = tokensSnap.map(s=> s.data()?.token).filter(Boolean) as string[]
  if (!tokens.length) return
  await admin.messaging().sendEachForMulticast({ tokens, notification: { title, body }, data: { orderId: order.id } })
}

function loc(x: any) { return { lat: x.latitude, lng: x.longitude } }

function distanceKm(a: {lat:number,lng:number}, b:{lat:number,lng:number}) {
  const toRad = (x:number)=>x*Math.PI/180
  const R = 6371
  const dLat = toRad(b.lat-a.lat)
  const dLon = toRad(b.lng-a.lng)
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat)
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(Math.don/2)**2
  return 2*R*Math.asin(Math.sqrt(h))
}

function waitMs(ms: number){ return new Promise(res=>setTimeout(res, ms)) }
