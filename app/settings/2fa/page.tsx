'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Shield, CheckCircle, XCircle, Loader } from 'lucide-react'
import Image from 'next/image'
import { apiUrl } from '@/lib/api'

export default function TwoFactorAuthPage() {
  const [step, setStep] = useState<'setup' | 'verify' | 'enabled'>('setup')
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if 2FA already enabled
    fetch2FAStatus()
  }, [])

  const fetch2FAStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/auth/me'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      if (data.user?.two_factor_enabled) {
        setStep('enabled')
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error)
    }
  }

  const handleSetup = async () => {
    setLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/auth/2fa/setup-2fa'),
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
        setQrCode(data.qrCode)
        setSecret(data.manualEntryKey)
        setStep('verify')
      } else {
        setError(data.message || 'Errore nella configurazione 2FA')
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      setError('Errore nella configurazione 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!token || token.length !== 6) {
      setError('Inserisci un codice a 6 cifre')
      return
    }

    setLoading(true)
    setError('')

    try {
      const authToken = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/auth/2fa/verify-2fa'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ token })
        }
      )

      const data = await response.json()
      if (data.success) {
        setStep('enabled')
      } else {
        setError(data.message || 'Codice non valido. Riprova.')
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error)
      setError('Errore nella verifica del codice')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!confirm('Sei sicuro di voler disabilitare il 2FA?')) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/auth/2fa/disable-2fa'),
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
        setStep('setup')
        setQrCode('')
        setSecret('')
        setToken('')
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Shield className="text-primary" size={32} />
            Autenticazione a Due Fattori (2FA)
          </h1>
          <p className="text-text-secondary">
            Aggiungi un livello extra di sicurezza al tuo account
          </p>
        </div>

        {step === 'setup' && (
          <Card>
            <div className="text-center py-8">
              <Shield className="mx-auto mb-4 text-text-secondary opacity-50" size={64} />
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                2FA Non Configurato
              </h2>
              <p className="text-text-secondary mb-6">
                L'autenticazione a due fattori protegge il tuo account richiedendo un codice aggiuntivo dal tuo dispositivo mobile quando effettui il login.
              </p>
              <Button
                onClick={handleSetup}
                disabled={loading}
                className="flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Configurazione...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Configura 2FA
                  </>
                )}
              </Button>
              {error && (
                <p className="text-red-500 text-sm mt-4">{error}</p>
              )}
            </div>
          </Card>
        )}

        {step === 'verify' && (
          <Card>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Passo 1: Scansiona il QR Code
                </h2>
                <p className="text-sm text-text-secondary mb-4">
                  Apri la tua app di autenticazione (Google Authenticator, Authy, ecc.) e scansiona questo codice:
                </p>
                {qrCode && (
                  <div className="bg-white p-4 rounded-lg border border-border inline-block">
                    <Image
                      src={qrCode}
                      alt="QR Code 2FA"
                      width={200}
                      height={200}
                      unoptimized
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-2">
                  O inserisci manualmente questa chiave:
                </h3>
                <div className="p-3 bg-background rounded-lg border border-border font-mono text-sm break-all">
                  {secret}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Passo 2: Verifica il Codice
                </h2>
                <p className="text-sm text-text-secondary mb-4">
                  Inserisci il codice a 6 cifre generato dalla tua app:
                </p>
                <Input
                  type="text"
                  value={token}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setToken(value)
                    setError('')
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest"
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <XCircle size={16} />
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('setup')
                    setToken('')
                    setError('')
                  }}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={loading || token.length !== 6}
                  className="flex-1"
                >
                  {loading ? 'Verifica...' : 'Verifica e Attiva'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 'enabled' && (
          <Card>
            <div className="text-center py-8">
              <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                2FA Attivo
              </h2>
              <p className="text-text-secondary mb-6">
                L'autenticazione a due fattori è attiva sul tuo account. Dovrai inserire un codice ogni volta che effettui il login.
              </p>
              <Button
                variant="outline"
                onClick={handleDisable}
                disabled={loading}
                className="flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Disattivazione...
                  </>
                ) : (
                  <>
                    <XCircle size={18} />
                    Disattiva 2FA
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        <Card className="bg-background">
          <h3 className="font-semibold text-text-primary mb-2">
            Come funziona il 2FA?
          </h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>• Installi un'app di autenticazione sul tuo telefono (Google Authenticator, Authy, ecc.)</li>
            <li>• Scansioni il QR code o inserisci la chiave manualmente</li>
            <li>• Ogni volta che fai login, inserisci il codice di 6 cifre dall'app</li>
            <li>• Il codice cambia ogni 30 secondi per sicurezza</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  )
}

