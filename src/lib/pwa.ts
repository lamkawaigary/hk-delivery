export async function registerServiceWorker() {
  if (typeof window === 'undefined') return
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    } catch (e) {
      // no-op
    }
  }
}
