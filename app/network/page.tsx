'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, DollarSign, TrendingUp, Copy, CheckCircle, Clock, FileCheck, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NetworkGraph from '@/components/network/NetworkGraph'
import { apiUrl } from '@/lib/api'

interface NetworkStats {
  totalAffiliates: number
  totalCommissions: number
  availableCommissions: number
  pendingCommissions: number
  referralLink: string
  affiliates: Array<{
    id: number
    name: string
    email: string
    registrationDate: string
    subscriptionStatus: string
    kycStatus: string
    commissionsGenerated: number
    isInactive?: boolean
    atRiskLosingQualification?: boolean
    currentRank?: string
    groupVolume?: number
  }>
  inactiveCount?: number
  atRiskCount?: number
  growthData: Array<{ date: string; affiliates: number }>
  networkTree?: Array<{
    id: number
    name: string
    email: string
    referralCode: string
    level: number
    subscriptionStatus: string
  }>
  currentUserId?: number
  currentUserRole?: string
}

export default function NetworkPage() {
  const router = useRouter()
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'inactive' | 'atRisk'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchNetwork = async () => {
      const token = localStorage.getItem('token')
      
      try {
        const response = await fetch(
          apiUrl('/api/network/stats'),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (!response.ok) {
          if (response.status === 403) {
            router.push('/subscription')
            return
          }
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching network:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNetwork()
  }, [router])

  const copyReferralLink = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const filteredAffiliates = stats?.affiliates.filter((affiliate) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!affiliate.name.toLowerCase().includes(searchLower) &&
          !affiliate.email.toLowerCase().includes(searchLower) &&
          !affiliate.id.toString().includes(searchLower)) {
        return false
      }
    }
    
    // Status filter
    if (filter === 'active') return affiliate.subscriptionStatus === 'active'
    if (filter === 'pending') return affiliate.subscriptionStatus === 'pending'
    if (filter === 'inactive') return affiliate.isInactive === true
    if (filter === 'atRisk') return affiliate.atRiskLosingQualification === true
    return true
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <Card className="text-center py-12">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Accesso Network richiesto
          </h2>
          <p className="text-text-secondary mb-6">
            Attiva un abbonamento per accedere al Network Marketing
          </p>
          <Link href="/subscription">
            <Button>Attiva Abbonamento</Button>
          </Link>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Dashboard Network
          </h1>
          <p className="text-text-secondary">
            Gestisci i tuoi affiliati e monitora le commissioni
          </p>
        </div>

        {/* KYC Alert */}
        {stats.availableCommissions > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-3">
              <Clock className="text-yellow-600" size={24} />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Verifica KYC richiesta
                </h3>
                <p className="text-sm text-yellow-700">
                  Hai commissioni disponibili. Completa la verifica KYC per prelevarle.
                </p>
              </div>
              <Link href="/kyc">
                <Button variant="outline" className="bg-white">Vai a KYC</Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-secondary text-sm mb-1">Affiliati Totali</p>
                <p className="text-3xl font-bold text-text-primary">
                  {stats.totalAffiliates}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                <Users className="text-primary" size={24} />
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-text-secondary">
                Registrati tramite il tuo link
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-secondary text-sm mb-1">Commissioni Totali</p>
                <p className="text-3xl font-bold text-text-primary">
                  €{stats.totalCommissions.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                <TrendingUp className="text-primary" size={24} />
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-text-secondary">
                Tutte le commissioni generate
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-secondary text-sm mb-1">Disponibili</p>
                <p className="text-3xl font-bold text-primary">
                  €{stats.availableCommissions.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                <CheckCircle className="text-primary" size={24} />
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-text-secondary">
                Pronte per il prelievo
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-secondary text-sm mb-1">In Sospeso</p>
                <p className="text-3xl font-bold text-text-secondary">
                  €{stats.pendingCommissions.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                <Clock className="text-text-secondary" size={24} />
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-text-secondary">
                In attesa di verifica
              </p>
            </div>
          </Card>
        </div>

        {/* Referral Link */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Il tuo Link di Referral
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={stats.referralLink}
                  readOnly
                  className="input flex-1 bg-background"
                />
                <Button
                  variant="outline"
                  onClick={copyReferralLink}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle size={18} />
                      Copiato!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copia
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-text-secondary mt-2">
                Condividi questo link per invitare nuovi affiliati e guadagnare il 20% delle commissioni
              </p>
            </div>
          </div>
        </Card>

        {/* Network Graph - Always show if affiliates exist */}
        {stats && stats.affiliates && stats.affiliates.length > 0 ? (
          <NetworkGraph
            key={`graph-${stats.totalAffiliates}-${Date.now()}`}
            affiliates={stats.affiliates.map((aff: any) => ({
              id: aff.id,
              name: aff.name || 'N/A',
              email: aff.email || '',
              referralCode: aff.referralCode || '',
              level: 1,
              subscriptionStatus: aff.subscriptionStatus || 'inactive',
            }))}
            currentUserId={stats.currentUserId || 0}
            currentUserRole={stats.currentUserRole || 'network_member'}
          />
        ) : (
          <Card>
            <div className="text-center py-12">
              <Users className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
              <p className="text-text-secondary text-lg">Nessun affiliato da visualizzare nel grafico</p>
              <p className="text-sm text-text-secondary mt-2">
                Gli affiliati appariranno qui quando qualcuno si registra tramite il tuo link di referral
              </p>
              {stats && (
                <p className="text-xs text-text-secondary mt-4">
                  Stats disponibili: {JSON.stringify({ totalAffiliates: stats.totalAffiliates, hasAffiliates: !!stats.affiliates })}
                </p>
              )}
            </div>
          </Card>
        )}


        {/* Affiliates List */}
        <Card>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h3 className="text-lg font-semibold text-text-primary">
              I tuoi Affiliati
            </h3>
            <div className="flex gap-2 items-center flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cerca per nome, email o ID..."
                  className="pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {/* Filters */}
              <button
                onClick={() => setFilter('all')}
                className={`chip ${filter === 'all' ? 'chip-active' : ''}`}
              >
                Tutti
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`chip ${filter === 'active' ? 'chip-active' : ''}`}
              >
                Attivi
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`chip ${filter === 'pending' ? 'chip-active' : ''}`}
              >
                In attesa
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`chip ${filter === 'inactive' ? 'chip-active' : ''}`}
              >
                Inattivi
              </button>
              <button
                onClick={() => setFilter('atRisk')}
                className={`chip ${filter === 'atRisk' ? 'chip-active' : ''}`}
              >
                A Rischio
              </button>
            </div>
          </div>

          {/* Alerts for inactive/at risk */}
          {stats && (
            <>
              {(stats.inactiveCount || 0) > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>{stats.inactiveCount}</strong> affiliato/i inattivi negli ultimi 30 giorni
                  </p>
                </div>
              )}
              {(stats.atRiskCount || 0) > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    🚨 <strong>{stats.atRiskCount}</strong> affiliato/i a rischio di perdere la qualifica
                  </p>
                </div>
              )}
            </>
          )}

          {filteredAffiliates && filteredAffiliates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      Nome
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      Data Registrazione
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      Abbonamento
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      KYC
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-text-secondary">
                      Commissioni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAffiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="border-b border-border hover:bg-background">
                      <td className="py-4 px-4 text-text-secondary text-sm font-mono">
                        #{affiliate.id}
                      </td>
                      <td className="py-4 px-4 text-text-primary font-medium">
                        {affiliate.name}
                      </td>
                      <td className="py-4 px-4 text-text-secondary text-sm">
                        {affiliate.email}
                      </td>
                      <td className="py-4 px-4 text-text-secondary text-sm">
                        {new Date(affiliate.registrationDate).toLocaleDateString('it-IT')}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            affiliate.subscriptionStatus === 'active'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-yellow-100 text-yellow-600'
                          }`}
                        >
                          {affiliate.subscriptionStatus === 'active' ? 'Attivo' : 'In attesa'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            affiliate.kycStatus === 'verified'
                              ? 'bg-green-100 text-green-600'
                              : affiliate.kycStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {affiliate.kycStatus === 'verified'
                            ? 'Verificato'
                            : affiliate.kycStatus === 'pending'
                            ? 'In verifica'
                            : 'Non verificato'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-text-primary">
                        €{affiliate.commissionsGenerated.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              <Users className="mx-auto mb-3 text-text-secondary opacity-50" size={48} />
              <p>Nessun affiliato trovato</p>
              <p className="text-sm mt-1">
                Condividi il tuo link di referral per iniziare a costruire la tua rete
              </p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

