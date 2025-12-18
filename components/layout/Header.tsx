'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Bell, Search, X, ChevronDown } from 'lucide-react'
import { Button } from '../ui/Button'

interface HeaderProps {
  onMenuClick: () => void
  user?: any
}

export function Header({ onMenuClick, user }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const getRankBadgeClass = (rank: string) => {
    const rankClasses: Record<string, string> = {
      UNRANKED: 'bg-slate-100 text-slate-600',
      BRONZE: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800',
      SILVER: 'bg-gradient-to-r from-slate-100 to-gray-200 text-slate-700',
      GOLD: 'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800',
      PLATINUM: 'bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-800',
      DIAMOND: 'bg-gradient-to-r from-violet-100 via-purple-100 to-fuchsia-100 text-purple-800',
    }
    return rankClasses[rank] || rankClasses.UNRANKED
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 lg:px-6">
      <div className="flex items-center justify-between h-16">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu size={24} />
          </button>

          {/* Search - Desktop */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cerca..."
                className="w-64 pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 
                         focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
                         transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            {showSearch ? <X size={20} /> : <Search size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Bell size={20} />
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Notifiche</h3>
                  <Link href="/notifications" className="text-sm text-brand-600 hover:text-brand-700">
                    Vedi tutte
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-slate-900">Nuovo affiliato registrato</p>
                    <p className="text-xs text-slate-500 mt-1">2 minuti fa</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-slate-900">Commissione accreditata</p>
                    <p className="text-xs text-slate-500 mt-1">1 ora fa</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Rank Badge - Desktop */}
          {user?.currentRank && (
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${getRankBadgeClass(user.currentRank)}`}>
              <span>⭐</span>
              <span>{user.currentRank}</span>
            </div>
          )}

          {/* User Avatar - Desktop */}
          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold shadow-md">
              {user?.firstName?.[0] || 'U'}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cerca..."
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 
                       focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
