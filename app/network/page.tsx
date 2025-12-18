'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Users, 
  TrendingUp, 
  Network,
  ChevronRight,
  Target,
  Award,
  Layers,
  UserPlus,
  Activity
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/ui/StatsCard'
import { BarChart } from '@/components/charts/BarChart'
import { apiGet } from '@/lib/api'

interface NetworkStats {
  totalDownline: number
  activeDownline: number
  directSponsored: number
  leftVolume: number
  rightVolume: number
  levelBreakdown: { name: string; value: number }[]
  recentActivity: {
    id: string
    type: string
    user: string
    date: string
  }[]
}

export default function NetworkPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await apiGet('/api/network/stats')
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading network stats:', error)
      // Mock data
      setStats({
        totalDownline: 156,
        activeDownline: 142,
        directSponsored: 12,
        leftVolume: 45000,
        rightVolume: 38500,
        levelBreakdown: [
          { name: 'Liv 1', value: 12 },
          { name: 'Liv 2', value: 28 },
          { name: 'Liv 3', value: 45 },
          { name: 'Liv 4', value: 38 },
          { name: 'Liv 5', value: 22 },
          { name: 'Liv 6', value: 11 },
        ],
        recentActivity: [
          { id: '1', type: 'join', user: 'Mario Rossi', date: '2 minuti fa' },
          { id: '2', type: 'purchase', user: 'Giulia Bianchi', date: '15 minuti fa' },
          { id: '3', type: 'rank_up', user: 'Paolo Verdi', date: '1 ora fa' },
          { id: '4', type: 'join', user: 'Anna Ferrari', date: '3 ore fa' },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-xl">
                <Network className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Il Tuo Network
                </h1>
                <p className="text-slate-500">
                  Panoramica della tua struttura
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3"
          >
            <Link
              href="/referral-links"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-brand-300 transition-colors"
            >
              <UserPlus className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Invita</span>
            </Link>
            <Link
              href="/network/binary"
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
            >
              <Layers className="w-5 h-5" />
              <span className="text-sm font-medium">Albero Binario</span>
            </Link>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Downline Totale"
            value={stats.totalDownline}
            subtitle={`${stats.activeDownline} attivi`}
            icon={Users}
            color="brand"
            delay={0.1}
          />
          <StatsCard
            title="Diretti Sponsorizzati"
            value={stats.directSponsored}
            icon={Target}
            color="accent"
            delay={0.2}
          />
          <StatsCard
            title="Volume Sinistro"
            value={`€${stats.leftVolume.toLocaleString('it-IT')}`}
            icon={TrendingUp}
            color="purple"
            delay={0.3}
          />
          <StatsCard
            title="Volume Destro"
            value={`€${stats.rightVolume.toLocaleString('it-IT')}`}
            icon={TrendingUp}
            color="gold"
            delay={0.4}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Level Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Distribuzione per Livello</h3>
                <p className="text-sm text-slate-500">Affiliati per livello di profondità</p>
              </div>
            </div>
            <BarChart
              data={stats.levelBreakdown}
              height={250}
              color="#6366f1"
            />
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-100 rounded-xl">
                  <Activity className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Attività Recenti</h3>
                  <p className="text-sm text-slate-500">Ultimi eventi nel tuo network</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {activity.user}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getActivityLabel(activity.type)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{activity.date}</span>
                </motion.div>
              ))}
            </div>

            <Link
              href="/notifications"
              className="flex items-center justify-center gap-2 mt-4 py-3 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-colors"
            >
              Vedi tutte le attività
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <QuickLink
            href="/network/binary"
            icon={Layers}
            title="Albero Binario"
            description="Visualizza e gestisci la struttura a 2 gambe"
            color="brand"
          />
          <QuickLink
            href="/qualifications"
            icon={Award}
            title="Qualifiche"
            description="Controlla i requisiti per il prossimo rank"
            color="gold"
          />
          <QuickLink
            href="/referral-links"
            icon={UserPlus}
            title="Genera Link"
            description="Crea nuovi link referral personalizzati"
            color="accent"
          />
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

function ActivityIcon({ type }: { type: string }) {
  const config: Record<string, { icon: any; bg: string; text: string }> = {
    join: { icon: UserPlus, bg: 'bg-accent-100', text: 'text-accent-600' },
    purchase: { icon: Target, bg: 'bg-brand-100', text: 'text-brand-600' },
    rank_up: { icon: Award, bg: 'bg-amber-100', text: 'text-amber-600' },
  }

  const { icon: Icon, bg, text } = config[type] || config.join

  return (
    <div className={`p-2 rounded-xl ${bg}`}>
      <Icon className={`w-4 h-4 ${text}`} />
    </div>
  )
}

function getActivityLabel(type: string): string {
  const labels: Record<string, string> = {
    join: 'Si è registrato',
    purchase: 'Ha effettuato un acquisto',
    rank_up: 'Ha raggiunto un nuovo rank',
  }
  return labels[type] || 'Attività'
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string
  icon: any
  title: string
  description: string
  color: 'brand' | 'accent' | 'gold'
}) {
  const colorClasses = {
    brand: 'bg-brand-50 hover:bg-brand-100 border-brand-200',
    accent: 'bg-accent-50 hover:bg-accent-100 border-accent-200',
    gold: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
  }

  const iconClasses = {
    brand: 'bg-brand-500 text-white',
    accent: 'bg-accent-500 text-white',
    gold: 'bg-amber-500 text-white',
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-5 rounded-2xl border transition-all group ${colorClasses[color]}`}
    >
      <div className={`p-3 rounded-xl ${iconClasses[color]} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
    </Link>
  )
}
