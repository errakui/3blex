'use client'

import { Bell, User, LogOut } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  userName: string
  onLogout: () => void
}

export const Header: React.FC<HeaderProps> = ({ userName, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/80 backdrop-blur-sm border-b border-border-light flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-medium text-text-primary">
          Hi, {userName} 👋
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-lg hover:bg-background-subtle transition-colors duration-200"
        >
          <Bell size={18} className="text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white"></span>
        </button>

        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-soft">
          <User size={16} className="text-white" />
        </div>

        <button
          onClick={onLogout}
          className="p-2 rounded-lg hover:bg-background-subtle transition-colors duration-200"
          title="Logout"
        >
          <LogOut size={18} className="text-text-secondary" />
        </button>
      </div>
    </header>
  )
}

