'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'brand' | 'accent' | 'gold' | 'info'
  className?: string
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  className = '',
}: StatsCardProps) {
  const iconColors = {
    default: 'bg-slate-100 text-slate-600',
    brand: 'bg-brand-100 text-brand-600',
    accent: 'bg-accent-100 text-accent-600',
    gold: 'bg-amber-100 text-amber-600',
    info: 'bg-blue-100 text-blue-600',
  }

  const trendColors = {
    positive: 'text-accent-600 bg-accent-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-50',
  }

  const getTrendType = () => {
    if (!trend) return 'neutral'
    if (trend.value > 0) return 'positive'
    if (trend.value < 0) return 'negative'
    return 'neutral'
  }

  const TrendIcon = () => {
    const type = getTrendType()
    if (type === 'positive') return <TrendingUp className="w-3 h-3" />
    if (type === 'negative') return <TrendingDown className="w-3 h-3" />
    return <Minus className="w-3 h-3" />
  }

  return (
    <div className={`card p-6 relative overflow-hidden group ${className}`}>
      {/* Background decoration */}
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.07] transition-transform duration-500 group-hover:scale-150 ${
        variant === 'brand' ? 'bg-brand-500' :
        variant === 'accent' ? 'bg-accent-500' :
        variant === 'gold' ? 'bg-amber-500' :
        variant === 'info' ? 'bg-blue-500' :
        'bg-slate-500'
      }`} />

      <div className="relative">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconColors[variant]}`}>
          {icon}
        </div>

        {/* Value */}
        <p className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
          {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
        </p>

        {/* Title & Trend */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{title}</p>
          
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendColors[getTrendType()]}`}>
              <TrendIcon />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {trend && (
          <p className="text-xs text-slate-400 mt-2">{trend.label}</p>
        )}
      </div>
    </div>
  )
}

// Compact version for mobile
export function StatsCardCompact({
  title,
  value,
  icon,
  variant = 'default',
  className = '',
}: Omit<StatsCardProps, 'trend'>) {
  const iconColors = {
    default: 'bg-slate-100 text-slate-600',
    brand: 'bg-brand-100 text-brand-600',
    accent: 'bg-accent-100 text-accent-600',
    gold: 'bg-amber-100 text-amber-600',
    info: 'bg-blue-100 text-blue-600',
  }

  return (
    <div className={`flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 ${className}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColors[variant]}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-slate-900 truncate">
          {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
        </p>
        <p className="text-xs text-slate-500 truncate">{title}</p>
      </div>
    </div>
  )
}

export default StatsCard
