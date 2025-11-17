"use client"
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function Home() {
  const { t, locale, setLocale } = useI18n()
  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('app_title')}</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded" onClick={()=>setLocale(locale==='zh-HK'?'en':'zh-HK')}>{t('switch_lang')}</button>
          <button className="px-3 py-1 border rounded" onClick={()=>document.documentElement.classList.toggle('dark')}>{t('switch_dark')}</button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link className="p-4 border rounded hover:bg-gray-100 dark:hover:bg-gray-900" href="/user">{t('user')}</Link>
        <Link className="p-4 border rounded hover:bg-gray-100 dark:hover:bg-gray-900" href="/store">{t('store')}</Link>
        <Link className="p-4 border rounded hover:bg-gray-100 dark:hover:bg-gray-900" href="/driver">{t('driver')}</Link>
        <Link className="p-4 border rounded hover:bg-gray-100 dark:hover:bg-gray-900" href="/admin">{t('admin')}</Link>
      </div>
    </main>
  )
}
