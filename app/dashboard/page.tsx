'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TrendingUp, Users, DollarSign, ShoppingBag, Award, Wallet, AlertCircle, CheckCircle, MessageSquare, Bell } from 'lucide-react'
import Link from 'next/link'
import { apiUrl } from '@/lib/api'

interface DashboardData {
  stats: {
    totalAffiliates: number
    totalCommissions: number
    availableBalance: number
    pendingCommissions: number
    totalOrders: number
  }
  recentOrders: any[]
  notifications: any[]
  kycStatus: string
  broadcasts?: Array<{
    id: number
    title: string
    message: string
    priority: string
    created_at: string
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/auth/me'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const userData = await response.json()
      if (userData.user) {
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/dashboard'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const dashboardData = await response.json()
      if (dashboardData) {
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  const hasNetworkAccess = user?.role === 'network_member' || user?.role === 'admin'
  const stats = data?.stats || {
    totalAffiliates: 0,
    totalCommissions: 0,
    availableBalance: 0,
    pendingCommissions: 0,
    totalOrders: 0
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-1">
            Hi, {user?.name || 'User'} 👋
          </h1>
          <p className="text-sm text-text-secondary">
            Benvenuto nella tua dashboard 3Blex
          </p>
        </div>

        {/* KYC Alert */}
        {data?.kycStatus !== 'verified' && (
          <Card className="bg-yellow-50/50 border-yellow-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">KYC Non Verificato</p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  Completa la verifica KYC per poter prelevare le commissioni
                </p>
              </div>
              <Link href="/kyc">
                <Button variant="outline" size="sm" className="text-xs">
                  Completa KYC
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {hasNetworkAccess && (
            <>
              <Card className="card-hover">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Users className="text-blue-600" size={20} />
                    </div>
                  </div>
                  <p className="text-2xl font-semibold text-text-primary mb-1">{stats.totalAffiliates}</p>
                  <p className="text-xs text-text-secondary">Affiliati Diretti</p>
                </div>
              </Card>

              <Card className="card-hover">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <DollarSign className="text-green-600" size={20} />
                    </div>
                  </div>
                  <p className="text-2xl font-semibold text-text-primary mb-1">
                    €{stats.totalCommissions.toFixed(2)}
                  </p>
                  <p className="text-xs text-text-secondary">Commissioni Totali</p>
                </div>
              </Card>

              <Card className="card-hover">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Wallet className="text-purple-600" size={20} />
                    </div>
                  </div>
                  <p className="text-2xl font-semibold text-text-primary mb-1">
                    €{stats.availableBalance.toFixed(2)}
                  </p>
                  <p className="text-xs text-text-secondary">Saldo Disponibile</p>
                </div>
              </Card>

              <Card className="card-hover">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-yellow-600" size={20} />
                    </div>
                  </div>
                  <p className="text-2xl font-semibold text-text-primary mb-1">
                    €{stats.pendingCommissions.toFixed(2)}
                  </p>
                  <p className="text-xs text-text-secondary">In Attesa</p>
                </div>
              </Card>
            </>
          )}

          {!hasNetworkAccess && (
            <>
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ShoppingBag className="text-primary" size={24} />
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalOrders}</p>
                  <p className="text-sm text-text-secondary">Ordini Totali</p>
                </div>
              </Card>

              <Card className="bg-primary-light border-primary">
                <div className="p-4 text-center">
                  <Award className="mx-auto mb-2 text-primary" size={32} />
                  <p className="font-semibold text-text-primary mb-2">Attiva Network</p>
                  <p className="text-sm text-text-secondary mb-3">
                    Sblocca tutte le funzionalità del network marketing
                  </p>
                  <Link href="/subscription">
                    <Button size="sm" className="w-full">
                      Abbonati Ora
                    </Button>
                  </Link>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions */}
        {hasNetworkAccess && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/network">
              <Card className="card-hover cursor-pointer border-2 border-transparent hover:border-primary/20">
                <div className="p-5 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="text-primary" size={24} />
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">My Network</p>
                  <p className="text-xs text-text-secondary">Visualizza struttura rete</p>
                </div>
              </Card>
            </Link>

            <Link href="/wallet">
              <Card className="card-hover cursor-pointer border-2 border-transparent hover:border-primary/20">
                <div className="p-5 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Wallet className="text-primary" size={24} />
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Wallet</p>
                  <p className="text-xs text-text-secondary">Gestisci commissioni</p>
                </div>
              </Card>
            </Link>

            <Link href="/referral-links">
              <Card className="card-hover cursor-pointer border-2 border-transparent hover:border-primary/20">
                <div className="p-5 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Users className="text-primary" size={24} />
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Link Referral</p>
                  <p className="text-xs text-text-secondary">Crea link personalizzati</p>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Broadcast Messages */}
        {data?.broadcasts && data.broadcasts.length > 0 && (
          <Card className="border-primary/30 border-2">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border-light">
              <MessageSquare className="text-primary" size={20} />
              <h2 className="text-base font-semibold text-text-primary">
                Messaggi Aziendali
              </h2>
            </div>
            <div className="space-y-2">
              {data.broadcasts.map((broadcast: any) => (
                <div
                  key={broadcast.id}
                  className={`p-3 rounded-lg border ${
                    broadcast.priority === 'urgent'
                      ? 'bg-red-50/50 border-red-200'
                      : broadcast.priority === 'high'
                      ? 'bg-yellow-50/50 border-yellow-200'
                      : 'bg-background-subtle border-border-light'
                  }`}
                >
                  <p className="text-sm font-semibold text-text-primary mb-1">
                    {broadcast.title}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {broadcast.message}
                  </p>
                  {broadcast.created_at && (
                    <p className="text-xs text-text-tertiary mt-2">
                      {new Date(broadcast.created_at).toLocaleDateString('it-IT')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Orders */}
        {stats.totalOrders > 0 && (
          <Card>
            <div className="p-5">
              <h2 className="text-base font-semibold text-text-primary mb-4">Ordini Recenti</h2>
              {data?.recentOrders && data.recentOrders.length > 0 ? (
                <div className="space-y-2">
                  {data.recentOrders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border border-border-light rounded-lg hover:bg-background-subtle transition-colors">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Ordine #{order.orderNumber}</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {new Date(order.createdAt || order.date).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-text-primary">€{order.total.toFixed(2)}</p>
                        <p className={`text-xs mt-0.5 ${
                          order.status === 'delivered' ? 'text-green-600' :
                          order.status === 'processing' ? 'text-yellow-600' :
                          'text-text-tertiary'
                        }`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">Nessun ordine recente</p>
              )}
              <Link href="/orders">
                <Button variant="outline" className="w-full mt-4 text-xs">
                  Vedi Tutti gli Ordini
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Notifications */}
        {data?.notifications && data.notifications.length > 0 && (
          <Card>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="text-primary" size={18} />
                <h2 className="text-base font-semibold text-text-primary">
                  Notifiche Recenti
                </h2>
              </div>
              <div className="space-y-2">
                {data.notifications.slice(0, 5).map((notification: any) => (
                  <div key={notification.id} className="flex items-start gap-3 p-3 border border-border-light rounded-lg hover:bg-background-subtle transition-colors">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="text-primary" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-text-primary font-medium mb-0.5">
                        {notification.title}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {notification.message}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1.5">
                        {new Date(notification.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/notifications">
                <Button variant="outline" className="w-full mt-4 text-xs">
                  Vedi Tutte le Notifiche
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
