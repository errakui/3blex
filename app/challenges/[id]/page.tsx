'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiUrl } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Trophy, TrendingUp, Target, Award, Users } from 'lucide-react'
import Link from 'next/link'

interface Challenge {
  id: number
  name: string
  description: string
  type: string
  startDate: string
  endDate: string
  requirements: any
  prizes: any
}

interface Progress {
  progressPercentage: number
  requirementsMet: any
}

export default function ChallengeDetailPage() {
  const params = useParams()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchChallenge(params.id as string)
    }
  }, [params.id])

  const fetchChallenge = async (id: string) => {
    try {
      const token = localStorage.getItem('token')

      const challengeResponse = await fetch(
        apiUrl('/api/events/challenges/list'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const challengesData = await challengeResponse.json()
      if (challengesData.success) {
        const found = challengesData.challenges.find((c: Challenge) => c.id === parseInt(id))
        if (found) {
          setChallenge(found)
        }
      }

      const progressResponse = await fetch(
        apiUrl('/api/events/challenges/${id}/progress'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const progressData = await progressResponse.json()
      if (progressData.success) {
        setProgress(progressData.progress)
      }
    } catch (error) {
      console.error('Error fetching challenge:', error)
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

  if (!challenge) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-12">
            <p className="text-text-secondary">Challenge non trovata</p>
            <Link href="/events">
              <Button variant="outline" className="mt-4">
                Torna agli Eventi
              </Button>
            </Link>
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  const progressPercentage = progress?.progressPercentage || 0
  const daysRemaining = Math.ceil(
    (new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <Link href="/events">
          <Button variant="outline">
            ← Torna agli Eventi
          </Button>
        </Link>

        <Card>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="text-yellow-500" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-text-primary">{challenge.name}</h1>
                <p className="text-text-secondary">
                  {new Date(challenge.startDate).toLocaleDateString('it-IT')} -{' '}
                  {new Date(challenge.endDate).toLocaleDateString('it-IT')}
                </p>
              </div>
            </div>

            <p className="text-lg text-text-secondary leading-relaxed">
              {challenge.description}
            </p>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-text-primary">Il Tuo Progresso</span>
                <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-4 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {daysRemaining > 0 && (
                <p className="text-sm text-text-secondary mt-2">
                  {daysRemaining} giorni rimanenti
                </p>
              )}
            </div>

            {/* Requirements */}
            {challenge.requirements && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Target size={20} />
                  Requisiti
                </h2>
                <div className="space-y-2">
                  {Object.entries(challenge.requirements).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <span className="text-text-secondary">{key}</span>
                      <span className="font-medium text-text-primary">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prizes */}
            {challenge.prizes && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Award size={20} />
                  Premi
                </h2>
                <div className="space-y-2">
                  {Array.isArray(challenge.prizes) ? (
                    challenge.prizes.map((prize: string, index: number) => (
                      <div key={index} className="p-3 bg-background rounded-lg border border-border">
                        <p className="text-text-primary">{prize}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-background rounded-lg border border-border">
                      <p className="text-text-primary">{JSON.stringify(challenge.prizes)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

