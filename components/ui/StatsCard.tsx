'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'brand' | 'accent' | 'gold' | 'purple'
  delay?: number
}

const colorClasses = {
  brand: {
    bg: 'bg-gradient-to-br from-brand-500 to-brand-600',
    light: 'bg-brand-50',
    text: 'text-brand-600',
    shadow: 'shadow-brand-500/20',
  },
  accent: {
    bg: 'bg-gradient-to-br from-accent-500 to-accent-600',
    light: 'bg-accent-50',
    text: 'text-accent-600',
    shadow: 'shadow-accent-500/20',
  },
  gold: {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    light: 'bg-amber-50',
    text: 'text-amber-600',
    shadow: 'shadow-amber-500/20',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500 to-pink-500',
    light: 'bg-purple-50',
    text: 'text-purple-600',
    shadow: 'shadow-purple-500/20',
  },
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'brand',
  delay = 0,
}: StatsCardProps) {
  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300"
    >
      {/* Background decoration */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${colors.bg} rounded-full opacity-10 blur-2xl`} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
            </h3>
            {trend && (
              <span
                className={`flex items-center text-sm font-medium ${
                  trend.isPositive ? 'text-accent-600' : 'text-red-500'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className={`p-3 rounded-xl ${colors.light}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      </div>
    </motion.div>
  )
}
