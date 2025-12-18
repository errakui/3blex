'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MapPin, Bell } from 'lucide-react'
import { apiUrl } from '@/lib/api'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [location, setLocation] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleComplete = async () => {
    setLoading(true)
    
    // Salva preferenze onboarding
    try {
      const token = localStorage.getItem('token')
      await fetch(
        apiUrl('/api/user/onboarding'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            location,
            notifications,
          }),
        }
      )
      router.push('/dashboard')
    } catch (err) {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Imposta la tua localizzazione
            </h2>
            <p className="text-text-secondary">
              Ci aiuta a fornirti contenuti e servizi più rilevanti
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="Città, Paese"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => router.push('/dashboard')}>
              Salta
            </Button>
            <Button className="flex-1" onClick={() => setStep(2)}>
              Continua
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="text-primary" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Attiva le notifiche
          </h2>
          <p className="text-text-secondary">
            Ricevi aggiornamenti importanti e notifiche sulle tue commissioni
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <label className="flex items-center justify-between p-4 border border-border rounded-xl cursor-pointer hover:bg-background">
            <span className="text-text-primary font-medium">Notifiche push</span>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="rounded border-border"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
            Indietro
          </Button>
          <Button className="flex-1" onClick={handleComplete} disabled={loading}>
            {loading ? 'Completamento...' : 'Completa'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

