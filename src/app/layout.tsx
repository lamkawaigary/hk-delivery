import './globals.css'
import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: '香港工程材料即時配送平台',
  description: 'Next.js + Firebase 實時派單配送',
  manifest: '/manifest.json'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK" className="dark">
      <body className="bg-white dark:bg-black text-black dark:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
