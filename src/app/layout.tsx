import type { Metadata } from 'next'
import { Noto_Serif_JP } from 'next/font/google'
import './globals.css'
import {BottomNav} from "@/components/shell/BottomNav";
import {TimerProvider} from "@/context/TimerContext";

const notoSerifJP = Noto_Serif_JP({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Exapp — 中小企業診断士 学習管理',
  description: '学習ログ・ミス分析・弱点復習を一元管理する、診断士試験特化の学習管理アプリ。',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <html lang="ja">
      <body className={notoSerifJP.variable}>
      <TimerProvider>
        {children}
        <BottomNav/>
      </TimerProvider>
      </body>
      </html>
  )
}
