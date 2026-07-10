'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="dashboard-layout">
      <Sidebar onCollapseChange={setCollapsed} />
      <div className={`dashboard-main${collapsed ? ' collapsed' : ''}`}>
        {children}
      </div>
    </div>
  )
}
