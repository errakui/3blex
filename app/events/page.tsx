'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, MapPin, Clock, Users, Trophy, TrendingUp } from 'lucide-react'
import { apiUrl } from '@/lib/api'

interface Event {
  id: number
  title: string
  description: string
  type: string
  startDate: string
  endDate: string
  location: string
  status: string
  isRegistered?: boolean
}

interface Challenge {
  id: number
  name: string
  type: string
  startDate: string
  endDate: string
  status: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'events' | 'challenges'>('events')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Fetch events
      const eventsResponse = await fetch(
        apiUrl('/api/events?status=upcoming'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const eventsData = await eventsResponse.json()
      if (eventsData.success) {
        setEvents(eventsData.events)
      }

      // Fetch challenges
      const challengesResponse = await fetch(
        apiUrl('/api/events/challenges/list?status=active'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const challengesData = await challengesResponse.json()
      if (challengesData.success) {
        setChallenges(challengesData.challenges)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/events/${eventId}/register'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()
      if (data.success) {
        alert('✅ Registrato con successo all\'evento!')
        fetchData()
      } else {
        alert('❌ Errore: ' + (data.message || 'Errore nella registrazione'))
      }
    } catch (error) {
      console.error('Error registering:', error)
      alert('❌ Errore nella registrazione')
    }
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      digital: 'Digitale',
      physical: 'Fisico',
      webinar: 'Webinar',
      training: 'Training',
      summit: 'Summit',
      meeting: 'Meeting'
    }
    return labels[type] || type
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
            <Calendar className="text-primary" size={32} />
            Eventi & Challenge
          </h1>
          <p className="text-text-secondary">
            Partecipa agli eventi aziendali e alle challenge mensili
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'events'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            Eventi
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'challenges'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            Challenge
          </button>
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Calendar className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
                  <p className="text-text-secondary">Nessun evento in programma</p>
                </div>
              </Card>
            ) : (
              events.map((event) => (
                <Card key={event.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-text-primary">{event.title}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-light text-primary">
                          {getEventTypeLabel(event.type)}
                        </span>
                      </div>

                      <p className="text-text-secondary mb-4">{event.description}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>
                            {new Date(event.startDate).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.type === 'digital' && event.location && (
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>Online</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      {event.isRegistered ? (
                        <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-600 font-medium text-sm">✓ Registrato</p>
                        </div>
                      ) : (
                        <Button onClick={() => handleRegister(event.id)}>
                          Registrati
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            {challenges.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Trophy className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
                  <p className="text-text-secondary">Nessuna challenge attiva</p>
                </div>
              </Card>
            ) : (
              challenges.map((challenge) => (
                <Card key={challenge.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Trophy className="text-yellow-500" size={24} />
                        <h3 className="text-xl font-semibold text-text-primary">{challenge.name}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
                          {challenge.type}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-text-secondary mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>
                            {new Date(challenge.startDate).toLocaleDateString('it-IT')} - {' '}
                            {new Date(challenge.endDate).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => window.location.href = `/events/challenges/${challenge.id}`}
                      >
                        Vedi Progresso
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

