import type { ReactNode } from 'react'
import { TopBar } from '@/components/shell/TopBar'
import { BottomNav } from '@/components/shell/BottomNav'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8f7f5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TopBar />
      <main style={{ flex: 1, paddingBottom: '60px' }}>{children}</main>
      <BottomNav />
    </div>
  )
}
