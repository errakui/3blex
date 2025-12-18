'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  FileText,
  Settings,
  Bell,
  Package,
  TrendingUp,
  Wallet,
  Award,
  Link as LinkIcon,
  Calendar,
  MessageSquare,
} from 'lucide-react'
import Image from 'next/image'

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/network', icon: TrendingUp, label: 'My Network', requiresNetwork: true },
  { href: '/qualifications', icon: Award, label: 'Qualifiche', requiresNetwork: true },
  { href: '/wallet', icon: Wallet, label: 'Wallet', requiresNetwork: true },
  { href: '/referral-links', icon: LinkIcon, label: 'Link Referral', requiresNetwork: true },
  { href: '/events', icon: Calendar, label: 'Eventi & Challenge', requiresNetwork: true },
  { href: '/products', icon: ShoppingBag, label: 'Prodotti' },
  { href: '/orders', icon: Package, label: 'I miei ordini' },
  { href: '/kyc', icon: FileText, label: 'Verifica KYC' },
  { href: '/support', icon: MessageSquare, label: 'Supporto' },
  { href: '/notifications', icon: Bell, label: 'Notifiche' },
  { href: '/settings', icon: Settings, label: 'Impostazioni' },
]

interface SidebarProps {
  userRole: string
  hasNetworkAccess: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole, hasNetworkAccess }) => {
  const pathname = usePathname()

  const filteredItems = menuItems.filter((item) => {
    if (item.requiresNetwork && !hasNetworkAccess) return false
    if (item.href === '/network' && userRole === 'admin') return false
    return true
  })

  const adminItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { href: '/admin/users', icon: Users, label: 'Gestione Utenti' },
    { href: '/admin/subscriptions', icon: TrendingUp, label: 'Abbonamenti' },
    { href: '/admin/commissions', icon: FileText, label: 'Commissioni' },
    { href: '/admin/products', icon: ShoppingBag, label: 'Catalogo' },
    { href: '/admin/orders', icon: Package, label: 'Ordini' },
    { href: '/admin/support', icon: MessageSquare, label: 'Support Tickets' },
  ]

  const allItems = userRole === 'admin' ? adminItems : filteredItems

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-border-light flex flex-col z-20">
      <div className="p-5 border-b border-border-light flex items-center justify-center">
        <Link href="/dashboard" className="flex items-center justify-center">
          <Image
            src="/assets/logo.png"
            alt="3Blex Logo"
            width={140}
            height={140}
            className="rounded-lg"
            unoptimized
          />
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {allItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${
                isActive
                  ? 'nav-item-active'
                  : 'nav-item-inactive'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

