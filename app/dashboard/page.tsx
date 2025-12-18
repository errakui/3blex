'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  Award,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  DollarSign,
  Target,
  Zap,
  Crown,
  Bell,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/ui/StatsCard'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { AreaChart } from '@/components/charts/AreaChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { apiGet } from '@/lib/api'
import toast from 'react-hot-toast'

interface DashboardData {
  wallet: {
    available: number
    pending: number
    earned: number
  }
  network: {
    totalDownline: number
    activeDownline: number
    leftVolume: number
    rightVolume: number
    directSponsored: number
  }
  rank: {
    current: string
    progress: number
    nextRank: string
  }
  commissions: {
    thisMonth: number
    lastMonth: number
    trend: number
  }
  referralCode: string
  notifications: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await apiGet('/api/dashboard')
      if (response.success) {
        setData(response.data)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      // Mock data for demo
      setData({
        wallet: {
          available: 2450.00,
          pending: 850.00,
          earned: 15680.00,
        },
        network: {
          totalDownline: 156,
          activeDownline: 142,
          leftVolume: 45000,
          rightVolume: 38500,
          directSponsored: 12,
        },
        rank: {
          current: 'GOLD',
          progress: 72,
          nextRank: 'PLATINUM',
        },
        commissions: {
          thisMonth: 1250.00,
          lastMonth: 980.00,
          trend: 27.5,
        },
        referralCode: 'REF3BLEX2024',
        notifications: 3,
      })
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = async () => {
    const link = `${window.location.origin}/ref/${data?.referralCode}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Link copiato negli appunti!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Errore nella copia')
    }
  }

  // Mock chart data
  const earningsData = [
    { name: 'Gen', direct: 400, binary: 800, multilevel: 200 },
    { name: 'Feb', direct: 600, binary: 1200, multilevel: 350 },
    { name: 'Mar', direct: 500, binary: 900, multilevel: 280 },
    { name: 'Apr', direct: 780, binary: 1400, multilevel: 420 },
    { name: 'Mag', direct: 900, binary: 1600, multilevel: 500 },
    { name: 'Giu', direct: 850, binary: 1800, multilevel: 580 },
  ]

  const commissionBreakdown = [
    { name: 'Commissione Binaria', value: 4500, color: '#6366f1' },
    { name: 'Commissione Diretta', value: 2800, color: '#10b981' },
    { name: 'Multilevel', value: 1200, color: '#f59e0b' },
    { name: 'Bonus Rank', value: 500, color: '#8b5cf6' },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Benvenuto! 👋
            </h1>
            <p className="text-slate-500 mt-1">
              Ecco un riepilogo della tua attività
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Link
              href="/notifications"
              className="relative p-3 bg-white rounded-xl border border-slate-200 hover:border-brand-300 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {data.notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {data.notifications}
                </span>
              )}
            </Link>
            <button
              onClick={copyReferralLink}
              className="flex items-center gap-2 px-4 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">Copia Link Referral</span>
            </button>
          </motion.div>
        </div>

        {/* Wallet Balance Card - Mobile Prominent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-brand-500 via-brand-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('/assets/pattern.svg')] opacity-10" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                  <Wallet className="w-6 h-6" />
                </div>
                <span className="font-medium opacity-90">Saldo Disponibile</span>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="text-4xl md:text-5xl font-bold mb-4">
              {showBalance ? `€${data.wallet.available.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '••••••'}
            </div>

            <div className="flex flex-wrap gap-4 md:gap-8">
              <div>
                <p className="text-sm opacity-70">In Attesa KYC</p>
                <p className="text-xl font-semibold">
                  {showBalance ? `€${data.wallet.pending.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '••••'}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-70">Totale Guadagnato</p>
                <p className="text-xl font-semibold">
                  {showBalance ? `€${data.wallet.earned.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '••••'}
                </p>
              </div>
              <Link
                href="/wallet"
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur transition-colors"
              >
                <span>Preleva</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Commissioni Mese"
            value={`€${data.commissions.thisMonth.toLocaleString('it-IT')}`}
            icon={DollarSign}
            trend={{ value: data.commissions.trend, isPositive: data.commissions.trend > 0 }}
            color="accent"
            delay={0.1}
          />
          <StatsCard
            title="Team Totale"
            value={data.network.totalDownline}
            subtitle={`${data.network.activeDownline} attivi`}
            icon={Users}
            color="brand"
            delay={0.2}
          />
          <StatsCard
            title="Diretti Sponsorizzati"
            value={data.network.directSponsored}
            icon={Target}
            color="purple"
            delay={0.3}
          />
          <StatsCard
            title="Rank Attuale"
            value={data.rank.current}
            subtitle={`${data.rank.progress}% verso ${data.rank.nextRank}`}
            icon={Crown}
            color="gold"
            delay={0.4}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Earnings Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Andamento Guadagni</h3>
                <p className="text-sm text-slate-500">Ultimi 6 mesi</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-brand-500" />
                  Binaria
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-accent-500" />
                  Diretta
                </span>
              </div>
            </div>
            <AreaChart
              data={earningsData}
              dataKeys={[
                { key: 'binary', color: '#6366f1', name: 'Binaria' },
                { key: 'direct', color: '#10b981', name: 'Diretta' },
                { key: 'multilevel', color: '#f59e0b', name: 'Multilevel' },
              ]}
              height={280}
              showLegend={false}
            />
          </motion.div>

          {/* Rank Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-card p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Progresso Rank</h3>
            <div className="flex flex-col items-center">
              <ProgressRing 
                progress={data.rank.progress} 
                size={140}
                color="gold"
                label={data.rank.current}
              />
              <div className="mt-6 text-center">
                <p className="text-slate-600">Prossimo obiettivo</p>
                <p className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2 mt-1">
                  <Crown className="w-5 h-5 text-amber-500" />
                  {data.rank.nextRank}
                </p>
              </div>
              <Link
                href="/qualifications"
                className="mt-4 text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
              >
                Vedi requisiti <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Binary Volumes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Volumi Binari</h3>
              <Link href="/network/binary" className="text-sm text-brand-600 hover:text-brand-700">
                Dettagli →
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-600">Gamba Sinistra</span>
                </div>
                <span className="font-semibold text-slate-900">
                  €{data.network.leftVolume.toLocaleString('it-IT')}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (data.network.leftVolume / Math.max(data.network.leftVolume, data.network.rightVolume)) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-slate-600">Gamba Destra</span>
                </div>
                <span className="font-semibold text-slate-900">
                  €{data.network.rightVolume.toLocaleString('it-IT')}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (data.network.rightVolume / Math.max(data.network.leftVolume, data.network.rightVolume)) * 100)}%` }}
                />
              </div>

              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Gamba debole:</span>{' '}
                  {data.network.leftVolume < data.network.rightVolume ? 'Sinistra' : 'Destra'}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Commissione binaria: €{(Math.min(data.network.leftVolume, data.network.rightVolume) * 0.1).toLocaleString('it-IT')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Commission Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-card p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Ripartizione Commissioni</h3>
            <DonutChart
              data={commissionBreakdown}
              height={220}
              centerLabel={{
                value: `€${commissionBreakdown.reduce((a, b) => a + b.value, 0).toLocaleString('it-IT')}`,
                subtitle: 'Totale',
              }}
            />
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-card p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Azioni Rapide</h3>
            <div className="space-y-3">
              <QuickLink
                href="/network/binary"
                icon={Users}
                title="Visualizza Network"
                description="Gestisci il tuo albero binario"
                color="brand"
              />
              <QuickLink
                href="/products"
                icon={Zap}
                title="Acquista Prodotti"
                description="Attiva il tuo account"
                color="accent"
              />
              <QuickLink
                href="/referral-links"
                icon={Target}
                title="Link Referral"
                description="Genera nuovi link"
                color="purple"
              />
              <QuickLink
                href="/kyc"
                icon={Award}
                title="Verifica KYC"
                description="Sblocca i prelievi"
                color="gold"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
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
  color: 'brand' | 'accent' | 'purple' | 'gold'
}) {
  const colorClasses = {
    brand: 'bg-brand-50 text-brand-600 group-hover:bg-brand-100',
    accent: 'bg-accent-50 text-accent-600 group-hover:bg-accent-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    gold: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
    >
      <div className={`p-2.5 rounded-xl transition-colors ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
          {title}
        </p>
        <p className="text-sm text-slate-500 truncate">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
    </Link>
  )
}
