'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toaster } from 'react-hot-toast'
import { apiUrl } from '@/lib/api'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch(apiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) {
          throw new Error('Not authenticated')
        }

        const data = await response.json()
        if (data.user) {
          setUser(data.user)
        }
      } catch (error) {
        localStorage.removeItem('token')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 animate-pulse">
            <span className="text-white font-bold text-2xl">3B</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            user={user}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 lg:px-6 py-6 lg:py-8 max-w-7xl">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
        </div>
      </div>
    </div>
  )
}

// Mobile Bottom Navigation
function MobileBottomNav() {
  const router = useRouter()
  const [pathname, setPathname] = useState('')

  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  const navItems = [
    { href: '/dashboard', icon: '🏠', label: 'Home' },
    { href: '/network', icon: '🌐', label: 'Network' },
    { href: '/wallet', icon: '💰', label: 'Wallet' },
    { href: '/products', icon: '🛍️', label: 'Shop' },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-40 safe-area-inset-bottom">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => {
                setPathname(item.href)
                router.push(item.href)
              }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-brand-50 text-brand-600' 
                  : 'text-slate-400 hover:text-slate-600'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-brand-600' : ''}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default DashboardLayout
