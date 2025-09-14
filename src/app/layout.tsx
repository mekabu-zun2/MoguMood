import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ご飯探索マップ',
  description: '気分に合わせて周辺の飲食店を検索できるアプリ',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}