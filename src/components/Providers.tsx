"use client"
import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/pwa'
import { I18nProvider } from '@/lib/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker()
  }, [])
  return (
    <I18nProvider>
      {children}
    </I18nProvider>
  )
}
