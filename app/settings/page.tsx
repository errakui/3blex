'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, MapPin, CreditCard, Bell, Shield, Save } from 'lucide-react'
import { apiUrl } from '@/lib/api'

interface ProfileData {
  name: string
  email: string
  phone: string
  dateOfBirth: string
  taxCode: string
  addressLine1: string
  addressLine2: string
  city: string
  postalCode: string
  country: string
  iban: string
  bankName: string
  notifications: boolean
  location: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Partial<ProfileData>>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/user/profile'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      if (data.success) {
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ProfileData, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/user/profile'),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: profile.name,
            phone: profile.phone,
            dateOfBirth: profile.dateOfBirth,
            taxCode: profile.taxCode,
            addressLine1: profile.addressLine1,
            addressLine2: profile.addressLine2,
            city: profile.city,
            postalCode: profile.postalCode,
            country: profile.country,
            iban: profile.iban,
            bankName: profile.bankName,
            notifications: profile.notifications,
            location: profile.location
          })
        }
      )

      const data = await response.json()
      if (data.success) {
        alert('✅ Profilo aggiornato con successo!')
      } else {
        alert('❌ Errore: ' + (data.message || 'Errore nel salvataggio'))
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('❌ Errore nel salvataggio del profilo')
    } finally {
      setSaving(false)
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
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Impostazioni
          </h1>
          <p className="text-text-secondary">
            Gestisci i tuoi dati personali, indirizzi e preferenze
          </p>
        </div>

        {/* Dati Personali */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <User className="text-primary" size={24} />
            <h2 className="text-xl font-semibold text-text-primary">
              Dati Personali
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nome Completo
              </label>
              <Input
                value={profile.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Mario Rossi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email
              </label>
              <Input
                value={profile.email || ''}
                disabled
                className="bg-background"
              />
              <p className="text-xs text-text-secondary mt-1">
                L'email non può essere modificata
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Telefono
              </label>
              <Input
                value={profile.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+39 123 456 7890"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Data di Nascita
                </label>
                <Input
                  type="date"
                  value={profile.dateOfBirth || ''}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Codice Fiscale
                </label>
                <Input
                  value={profile.taxCode || ''}
                  onChange={(e) => handleChange('taxCode', e.target.value)}
                  placeholder="RSSMRA80A01H501X"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Localizzazione
              </label>
              <Input
                value={profile.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Italia"
              />
            </div>
          </div>
        </Card>

        {/* Indirizzo */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="text-primary" size={24} />
            <h2 className="text-xl font-semibold text-text-primary">
              Indirizzo
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Indirizzo Linea 1
              </label>
              <Input
                value={profile.addressLine1 || ''}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                placeholder="Via Roma 123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Indirizzo Linea 2 (opzionale)
              </label>
              <Input
                value={profile.addressLine2 || ''}
                onChange={(e) => handleChange('addressLine2', e.target.value)}
                placeholder="Appartamento 5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Città
                </label>
                <Input
                  value={profile.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Roma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  CAP
                </label>
                <Input
                  value={profile.postalCode || ''}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  placeholder="00100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Paese
                </label>
                <Input
                  value={profile.country || ''}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="Italia"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Dati Bancari */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="text-primary" size={24} />
            <h2 className="text-xl font-semibold text-text-primary">
              Dati Bancari per Prelievi
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                IBAN
              </label>
              <Input
                value={profile.iban || ''}
                onChange={(e) => handleChange('iban', e.target.value)}
                placeholder="IT60 X054 2811 1010 0000 0123 456"
              />
              <p className="text-xs text-text-secondary mt-1">
                Necessario per i prelievi tramite bonifico
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nome Banca
              </label>
              <Input
                value={profile.bankName || ''}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="Banca di Roma"
              />
            </div>
          </div>
        </Card>

        {/* Preferenze */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <Bell className="text-primary" size={24} />
            <h2 className="text-xl font-semibold text-text-primary">
              Preferenze
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-text-primary">Notifiche Email</p>
                <p className="text-sm text-text-secondary">
                  Ricevi notifiche via email su eventi importanti
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.notifications ?? true}
                  onChange={(e) => handleChange('notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Sicurezza */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-primary" size={24} />
            <h2 className="text-xl font-semibold text-text-primary">
              Sicurezza
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-text-primary">Autenticazione a Due Fattori (2FA)</p>
                <p className="text-sm text-text-secondary">
                  Aggiungi un livello extra di sicurezza al tuo account
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/settings/2fa'}
              >
                Configura 2FA
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-text-primary">Cambia Password</p>
                <p className="text-sm text-text-secondary">
                  Aggiorna la tua password per sicurezza
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/reset-password'}
              >
                Cambia Password
              </Button>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
