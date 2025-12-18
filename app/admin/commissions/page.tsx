'use client'

import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { FileText, DollarSign, CheckCircle, Clock, X } from 'lucide-react'

interface Commission {
  id: number
  amount: number
  percentage: number
  status: 'pending' | 'available' | 'paid'
  created_at: string
  paid_at: string | null
  referrer_name: string
  referrer_email: string
  referred_name: string
  referred_email: string
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'available' | 'paid'>('all')

  useEffect(() => {
    const fetchCommissions = async () => {
      const token = localStorage.getItem('token')
      
      try {
        const response = await fetch(
          apiUrl('/api/admin/commissions'),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (!response.ok) {
          if (response.status === 403) {
            window.location.href = '/dashboard'
            return
          }
        }

        const data = await response.json()
        setCommissions(data.commissions || [])
      } catch (err) {
        console.error('Error fetching commissions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCommissions()
  }, [])

  const updateCommissionStatus = async (id: number, status: 'pending' | 'available' | 'paid') => {
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(
        apiUrl('/api/admin/commissions/${id}/status'),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      )

      if (response.ok) {
        setCommissions(commissions.map(c => 
          c.id === id ? { ...c, status: status as 'pending' | 'available' | 'paid' } : c
        ))
      }
    } catch (err) {
      console.error('Error updating commission:', err)
    }
  }

  const filteredCommissions = commissions.filter((commission) => {
    if (filter === 'all') return true
    return commission.status === filter
  })

  const totalAmount = filteredCommissions.reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0)

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
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Gestione Commissioni
          </h1>
          <p className="text-text-secondary">
            Gestisci e monitora tutte le commissioni del sistema
          </p>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Totale: €{totalAmount.toFixed(2)}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Chip
                active={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                Tutte
              </Chip>
              <Chip
                active={filter === 'pending'}
                onClick={() => setFilter('pending')}
              >
                In sospeso
              </Chip>
              <Chip
                active={filter === 'available'}
                onClick={() => setFilter('available')}
              >
                Disponibili
              </Chip>
              <Chip
                active={filter === 'paid'}
                onClick={() => setFilter('paid')}
              >
                Pagate
              </Chip>
            </div>
          </div>

          {filteredCommissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      Referrer
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      Referred
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      Importo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      %
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      Stato
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      Data
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-border hover:bg-background">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-text-primary">{commission.referrer_name}</p>
                          <p className="text-sm text-text-secondary">{commission.referrer_email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-text-primary">{commission.referred_name}</p>
                          <p className="text-sm text-text-secondary">{commission.referred_email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-text-primary">
                        €{parseFloat(commission.amount.toString()).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-text-secondary">
                        {commission.percentage}%
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            commission.status === 'paid'
                              ? 'bg-green-100 text-green-600'
                              : commission.status === 'available'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-yellow-100 text-yellow-600'
                          }`}
                        >
                          {commission.status === 'paid'
                            ? 'Pagata'
                            : commission.status === 'available'
                            ? 'Disponibile'
                            : 'In sospeso'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-text-secondary text-sm">
                        {new Date(commission.created_at).toLocaleDateString('it-IT')}
                      </td>
                      <td className="py-4 px-4">
                        {commission.status === 'available' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCommissionStatus(commission.id, 'paid')}
                          >
                            Segna come pagata
                          </Button>
                        )}
                        {commission.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCommissionStatus(commission.id, 'available')}
                          >
                            Approva
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              <FileText className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
              <p>Nessuna commissione trovata</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

