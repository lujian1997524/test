import type { Metadata } from 'next'
import '../styles/globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { GlobalSyncInitializer } from '@/components/common/SyncManager'

export const metadata: Metadata = {
  title: '激光切割生产管理系统',
  description: '公司内部激光切割生产计划管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <GlobalSyncInitializer />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}