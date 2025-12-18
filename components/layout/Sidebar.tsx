'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  Network,
  Wallet,
  ShoppingBag,
  Award,
  Link2,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Shield,
  BarChart3,
  Package,
  FileCheck,
  X,
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  user?: any
}

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/network', label: 'Network', icon: Network },
  { href: '/network/binary', label: 'Albero Binario', icon: Users },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/qualifications', label: 'Qualifiche', icon: Award },
  { href: '/referral-links', label: 'Link Referral', icon: Link2 },
]

const secondaryNavItems = [
  { href: '/products', label: 'Prodotti', icon: Package },
  { href: '/orders', label: 'Ordini', icon: ShoppingBag },
]

const settingsNavItems = [
  { href: '/kyc', label: 'Verifica KYC', icon: Shield },
  { href: '/settings', label: 'Impostazioni', icon: Settings },
  { href: '/support', label: 'Supporto', icon: HelpCircle },
]

const adminNavItems = [
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/users', label: 'Utenti', icon: Users },
  { href: '/admin/orders', label: 'Ordini', icon: ShoppingBag },
  { href: '/admin/commissions', label: 'Commissioni', icon: Wallet },
  { href: '/admin/products', label: 'Prodotti', icon: Package },
]

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isAdmin = user?.role === 'admin'

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

    return (
      <Link
        href={href}
        onClick={() => window.innerWidth < 1024 && onClose()}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
          transition-all duration-200 ease-out group relative
          ${isActive
            ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }
        `}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-500'} />
        {!collapsed && <span>{label}</span>}
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/30 rounded-l-full" />
        )}
      </Link>
    )
  }

  const NavSection = ({ title, items }: { title: string; items: typeof mainNavItems }) => (
    <div className="space-y-1">
      {!collapsed && (
        <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </p>
      )}
      {items.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
    </div>
  )

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white border-r border-slate-200
          transition-all duration-300 ease-out
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'w-20' : 'w-72'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image 
                src="/assets/logo.png" 
                alt="3Blex Logo" 
                width={40} 
                height={40} 
                className="rounded-xl shadow-lg shadow-brand-500/20"
              />
              {!collapsed && (
                <div>
                  <p className="font-bold text-slate-900">3Blex</p>
                  <p className="text-xs text-slate-500">Network Platform</p>
                </div>
              )}
            </Link>

            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X size={20} />
            </button>

            {/* Collapse button for desktop */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            <NavSection title="Principale" items={mainNavItems} />
            <NavSection title="E-commerce" items={secondaryNavItems} />
            <NavSection title="Account" items={settingsNavItems} />
            
            {isAdmin && (
              <NavSection title="Amministrazione" items={adminNavItems} />
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-100">
            {user && !collapsed && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold">
                  {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('token')
                window.location.href = '/login'
              }}
              className={`
                flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium
                text-red-600 hover:bg-red-50 transition-colors
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <LogOut size={20} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
