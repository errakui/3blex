'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Network, Users, TrendingUp, TrendingDown } from 'lucide-react'
import { apiUrl } from '@/lib/api'

interface BinaryStats {
  leftVolume: number
  rightVolume: number
  leftCount: number
  rightCount: number
  balance: number
}

export default function BinaryNetworkPage() {
  const [stats, setStats] = useState<BinaryStats | null>(null)
  const [tree, setTree] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBinaryData()
  }, [])

  const fetchBinaryData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Fetch binary stats
      const statsResponse = await fetch(
        apiUrl('/api/network-binary/binary-stats'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const statsData = await statsResponse.json()
      if (statsData.success) {
        setStats(statsData.stats)
      }

      // Fetch binary tree
      const treeResponse = await fetch(
        apiUrl('/api/network-binary/tree'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const treeData = await treeResponse.json()
      if (treeData.success) {
        setTree(treeData.tree)
      }
    } catch (error) {
      console.error('Error fetching binary data:', error)
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
            <Network className="text-primary" size={32} />
            Network Binario
          </h1>
          <p className="text-text-secondary">
            Visualizza la struttura binaria del tuo team
          </p>
        </div>

        {/* Binary Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-secondary">Gamba Sinistra</p>
                  <TrendingUp className="text-blue-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats.leftVolume.toFixed(2)}€</p>
                <p className="text-xs text-text-secondary mt-1">{stats.leftCount} affiliati</p>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-secondary">Gamba Destra</p>
                  <TrendingDown className="text-red-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats.rightVolume.toFixed(2)}€</p>
                <p className="text-xs text-text-secondary mt-1">{stats.rightCount} affiliati</p>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <p className="text-sm text-text-secondary mb-2">Bilanciamento</p>
                <p className={`text-2xl font-bold ${
                  stats.balance > 0 ? 'text-green-600' : stats.balance < 0 ? 'text-red-600' : 'text-text-primary'
                }`}>
                  {stats.balance > 0 ? '+' : ''}{stats.balance.toFixed(2)}€
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {Math.abs(stats.balance) < 100 ? 'Bilanciato' : 'Non bilanciato'}
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <p className="text-sm text-text-secondary mb-2">Volume Totale</p>
                <p className="text-2xl font-bold text-text-primary">
                  {(stats.leftVolume + stats.rightVolume).toFixed(2)}€
                </p>
                <p className="text-xs text-text-secondary mt-1">Volume combinato</p>
              </div>
            </Card>
          </div>
        )}

        {/* Binary Tree Info */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Struttura Binaria</h2>
            {tree ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm text-text-secondary mb-1">Volume Sinistra</p>
                    <p className="text-2xl font-bold text-text-primary">{tree.leftVolume || 0}€</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm text-text-secondary mb-1">Volume Destra</p>
                    <p className="text-2xl font-bold text-text-primary">{tree.rightVolume || 0}€</p>
                  </div>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-text-secondary mb-1">Volume Personale</p>
                  <p className="text-xl font-bold text-primary">{tree.pv || 0}€</p>
                </div>
                <div className="p-4 bg-background rounded-lg border">
                  <p className="text-sm text-text-secondary mb-1">Volume Gruppo</p>
                  <p className="text-xl font-bold text-text-primary">{tree.gv || 0}€</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Network className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
                <p className="text-text-secondary">Nessuna struttura binaria disponibile</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

