'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Award, TrendingUp, Target, Clock, CheckCircle, Star } from 'lucide-react'
import { apiUrl } from '@/lib/api'

interface QualificationStatus {
  currentRank: {
    name: string
    displayName: string
    level: number
  }
  currentVolumes: {
    pv: number
    gv: number
    leftVolume: number
    rightVolume: number
  }
  nextRank: {
    name: string
    displayName: string
    level: number
    requiredPv: number
    requiredGv: number
    requiredLeftVolume: number
    requiredRightVolume: number
    requiredQualifiedLegs: number
    bonusAmount: number
    rewards: any
  } | null
  progress: {
    percentage: number
    missingPv: number
    missingGv: number
    missingLeftVolume: number
    missingRightVolume: number
    missingQualifiedLegs: number
  }
  monthQualification: {
    rankName: string
    achievedAt: string
    periodStart: string
    periodEnd: string
    pv: number
    gv: number
  } | null
  monthObjective: {
    daysRemaining: number
    monthEnd: string
  }
  history: Array<{
    rankName: string
    achievedAt: string
    periodStart: string
    periodEnd: string
    pv: number
    gv: number
  }>
}

export default function QualificationsPage() {
  const [status, setStatus] = useState<QualificationStatus | null>(null)
  const [ranks, setRanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    
    try {
      // Fetch status
      const statusResponse = await fetch(
        apiUrl('/api/qualifications/my-status'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const statusData = await statusResponse.json()
      if (statusData.success) {
        setStatus(statusData)
      }

      // Fetch all ranks
      const ranksResponse = await fetch(
        apiUrl('/api/qualifications/ranks'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const ranksData = await ranksResponse.json()
      if (ranksData.success) {
        setRanks(ranksData.ranks)
      }
    } catch (error) {
      console.error('Error fetching qualifications:', error)
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

  if (!status) {
    return (
      <DashboardLayout>
        <Card>
          <p className="text-text-secondary">Errore nel caricamento delle qualifiche</p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Award className="text-primary" size={32} />
            Le Mie Qualifiche
          </h1>
          <p className="text-text-secondary">
            Visualizza il tuo stato qualifica, progresso e obiettivi mensili
          </p>
        </div>

        {/* Current Rank Card */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Qualifica Attuale</p>
              <h2 className="text-3xl font-bold text-text-primary">
                {status.currentRank.displayName}
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Livello {status.currentRank.level}
              </p>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
              <Award className="text-white" size={40} />
            </div>
          </div>
        </Card>

        {/* Progress to Next Rank */}
        {status.nextRank && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Prossima Qualifica: {status.nextRank.displayName}
                </h3>
                <p className="text-sm text-text-secondary">
                  Bonus: €{status.nextRank.bonusAmount.toFixed(2)}
                </p>
              </div>
              <Target className="text-primary" size={24} />
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">
                  Completamento
                </span>
                <span className="text-sm font-bold text-primary">
                  {status.progress.percentage}%
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500 rounded-full"
                  style={{ width: `${status.progress.percentage}%` }}
                />
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-3">
              <h4 className="font-semibold text-text-primary">Requisiti Mancanti:</h4>
              
              {status.progress.missingPv > 0 && (
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-text-secondary">Volume Personale (PV)</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {status.currentVolumes.pv.toFixed(2)} / {status.nextRank.requiredPv.toFixed(2)}
                    <span className="text-red-500 ml-2">
                      (Mancano: {status.progress.missingPv.toFixed(2)})
                    </span>
                  </span>
                </div>
              )}

              {status.progress.missingGv > 0 && (
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-text-secondary">Volume Gruppo (GV)</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {status.currentVolumes.gv.toFixed(2)} / {status.nextRank.requiredGv.toFixed(2)}
                    <span className="text-red-500 ml-2">
                      (Mancano: {status.progress.missingGv.toFixed(2)})
                    </span>
                  </span>
                </div>
              )}

              {status.progress.missingLeftVolume > 0 && (
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-text-secondary">Volume Gamba Sinistra</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {status.currentVolumes.leftVolume.toFixed(2)} / {status.nextRank.requiredLeftVolume.toFixed(2)}
                    <span className="text-red-500 ml-2">
                      (Mancano: {status.progress.missingLeftVolume.toFixed(2)})
                    </span>
                  </span>
                </div>
              )}

              {status.progress.missingRightVolume > 0 && (
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-text-secondary">Volume Gamba Destra</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {status.currentVolumes.rightVolume.toFixed(2)} / {status.nextRank.requiredRightVolume.toFixed(2)}
                    <span className="text-red-500 ml-2">
                      (Mancano: {status.progress.missingRightVolume.toFixed(2)})
                    </span>
                  </span>
                </div>
              )}

              {status.progress.missingQualifiedLegs > 0 && (
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-text-secondary">Linee Qualificate</span>
                  <span className="text-sm font-semibold text-text-primary">
                    0 / {status.nextRank.requiredQualifiedLegs}
                    <span className="text-red-500 ml-2">
                      (Mancano: {status.progress.missingQualifiedLegs})
                    </span>
                  </span>
                </div>
              )}

              {/* Rewards Preview */}
              {status.nextRank.rewards && (
                <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-semibold text-primary mb-2">🎁 Premi per {status.nextRank.displayName}:</p>
                  <div className="text-sm text-text-secondary">
                    {status.nextRank.rewards.benefits?.map((benefit: string, idx: number) => (
                      <p key={idx}>• {benefit}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Current Volumes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-1">Volume Personale</p>
              <p className="text-2xl font-bold text-text-primary">
                {status.currentVolumes.pv.toFixed(2)}
              </p>
              <p className="text-xs text-text-secondary mt-1">PV</p>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-1">Volume Gruppo</p>
              <p className="text-2xl font-bold text-text-primary">
                {status.currentVolumes.gv.toFixed(2)}
              </p>
              <p className="text-xs text-text-secondary mt-1">GV</p>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-1">Gamba Sinistra</p>
              <p className="text-2xl font-bold text-text-primary">
                {status.currentVolumes.leftVolume.toFixed(2)}
              </p>
              <p className="text-xs text-text-secondary mt-1">Volume</p>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-1">Gamba Destra</p>
              <p className="text-2xl font-bold text-text-primary">
                {status.currentVolumes.rightVolume.toFixed(2)}
              </p>
              <p className="text-xs text-text-secondary mt-1">Volume</p>
            </div>
          </Card>
        </div>

        {/* Month Objective */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                Obiettivo del Mese
              </h3>
              <p className="text-sm text-text-secondary">
                {status.monthQualification 
                  ? `Hai raggiunto: ${status.monthQualification.rankName}`
                  : `Mancano ${status.monthObjective.daysRemaining} giorni`}
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Clock size={24} />
              <span className="text-2xl font-bold">
                {status.monthObjective.daysRemaining}
              </span>
            </div>
          </div>
          {status.monthObjective.daysRemaining > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                <span>Tempo rimanente</span>
                <span>Fine mese: {new Date(status.monthObjective.monthEnd).toLocaleDateString('it-IT')}</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ 
                    width: `${Math.max(0, 100 - (status.monthObjective.daysRemaining / 30) * 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* All Available Ranks */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Tutte le Qualifiche Disponibili
          </h3>
          <div className="space-y-3">
            {ranks.map((rank, index) => {
              const isCurrent = rank.name === status.currentRank.name
              const isAchieved = rank.level <= status.currentRank.level
              
              return (
                <div
                  key={rank.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCurrent
                      ? 'border-primary bg-primary/5'
                      : isAchieved
                      ? 'border-green-500 bg-green-50'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCurrent
                          ? 'bg-primary text-white'
                          : isAchieved
                          ? 'bg-green-500 text-white'
                          : 'bg-background text-text-secondary'
                      }`}>
                        {isAchieved ? (
                          <CheckCircle size={24} />
                        ) : (
                          <Star size={24} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary">
                          {rank.displayName}
                          {isCurrent && <span className="ml-2 text-xs text-primary">(Attuale)</span>}
                        </h4>
                        <p className="text-xs text-text-secondary">
                          Livello {rank.level} • Bonus: €{rank.bonusAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-text-secondary">
                      <p>PV: {rank.requiredPv}</p>
                      <p>GV: {rank.requiredGv}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* History */}
        {status.history.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Storico Qualifiche
            </h3>
            <div className="space-y-3">
              {status.history.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-text-primary">{item.rankName}</p>
                    <p className="text-xs text-text-secondary">
                      {new Date(item.periodStart).toLocaleDateString('it-IT')} -{' '}
                      {new Date(item.periodEnd).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-text-secondary">PV: {item.pv.toFixed(2)}</p>
                    <p className="text-text-secondary">GV: {item.gv.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

