"use client"
import { createContext, useContext, useState } from 'react'

type Locale = 'zh-HK' | 'en'
const dict: Record<Locale, Record<string, string>> = {
  'zh-HK': {
    app_title: '香港工程材料即時配送平台',
    user: '用戶', store: '商店', driver: '司機', admin: '後台',
    switch_lang: '切換語言', switch_dark: '深色模式'
  },
  en: {
    app_title: 'HK Construction Materials Delivery',
    user: 'User', store: 'Store', driver: 'Driver', admin: 'Admin',
    switch_lang: 'Language', switch_dark: 'Dark Mode'
  }
}

const I18nCtx = createContext<{ t: (k: string)=>string, locale: Locale, setLocale: (l:Locale)=>void }>({ t: (k)=>k, locale: 'zh-HK', setLocale: ()=>{} })

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('zh-HK')
  const t = (k: string) => dict[locale][k] ?? k
  return <I18nCtx.Provider value={{ t, locale, setLocale }}>{children}</I18nCtx.Provider>
}

export function useI18n() {
  return useContext(I18nCtx)
}
