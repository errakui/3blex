'use client'

import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiUrl } from '@/lib/api'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Fetch user data
    fetch(apiUrl('/api/auth/me'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null

  const hasNetworkAccess = user.role === 'network_member' || user.role === 'admin'

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={user.role} hasNetworkAccess={hasNetworkAccess} />
      <Header userName={user.name || user.email} onLogout={handleLogout} />
      <main className="ml-64 mt-16 p-8">{children}</main>
    </div>
  )
}

