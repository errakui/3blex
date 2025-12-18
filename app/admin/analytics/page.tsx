'use client'

import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { TrendingUp, Users, DollarSign, ShoppingBag, Award } from 'lucide-react'

interface Analytics {
  totalUsers: number
  activeSubscriptions: number
  totalRevenue: number
  totalCommissions: number
  totalOrders: number
  kycPending: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/admin/analytics'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <TrendingUp className="text-primary" size={32} />
            Analytics
          </h1>
          <p className="text-text-secondary">
            Statistiche e metriche della piattaforma
          </p>
        </div>

        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="text-blue-500" size={32} />
                  <span className="text-3xl font-bold text-text-primary">
                    {analytics.totalUsers}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">Utenti Totali</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Award className="text-green-500" size={32} />
                  <span className="text-3xl font-bold text-text-primary">
                    {analytics.activeSubscriptions}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">Abbonamenti Attivi</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="text-yellow-500" size={32} />
                  <span className="text-3xl font-bold text-text-primary">
                    €{analytics.totalRevenue.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">Ricavi Totali</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="text-purple-500" size={32} />
                  <span className="text-3xl font-bold text-text-primary">
                    €{analytics.totalCommissions.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">Commissioni Totali</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <ShoppingBag className="text-orange-500" size={32} />
                  <span className="text-3xl font-bold text-text-primary">
                    {analytics.totalOrders}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">Ordini Totali</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="text-red-500" size={32} />
                  <span className="text-3xl font-bold text-text-primary">
                    {analytics.kycPending}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">KYC in Attesa</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

