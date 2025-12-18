'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Lock, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiUrl } from '@/lib/api'

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Check if token in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tokenParam = urlParams.get('token')
      if (tokenParam) {
        setToken(tokenParam)
        setStep('reset')
      }
    }
  }, [])

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        apiUrl('/api/auth/password-reset/request'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }
      )

      const data = await response.json()
      if (data.success) {
        setMessage('Se l\'email esiste, riceverai un link per il reset della password.')
      } else {
        setError(data.message || 'Errore nella richiesta reset')
      }
    } catch (error) {
      console.error('Error requesting password reset:', error)
      setError('Errore nella richiesta reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (newPassword !== confirmPassword) {
      setError('Le password non corrispondono')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('La password deve essere di almeno 8 caratteri')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        apiUrl('/api/auth/password-reset/reset'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword })
        }
      )

      const data = await response.json()
      if (data.success) {
        setMessage('Password resettata con successo! Reindirizzamento al login...')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        setError(data.message || 'Token non valido o scaduto')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      setError('Errore nel reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/assets/logo.png"
              alt="3Blex Logo"
              width={180}
              height={180}
              className="rounded-lg"
              unoptimized
            />
          </Link>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center justify-center gap-3">
            <Lock className="text-primary" size={32} />
            Reset Password
          </h1>
          <p className="text-text-secondary">
            {step === 'request' 
              ? 'Inserisci la tua email per ricevere il link di reset'
              : 'Inserisci la nuova password'}
          </p>
        </div>

        <Card>
          {step === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {message && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">{message}</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? 'Invio...' : 'Invia Link Reset'}
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-primary hover:underline">
                  Torna al Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nuova Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 8 caratteri"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Conferma Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ripeti la password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {message && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={20} />
                  <p className="text-green-800 text-sm">{message}</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full"
              >
                {loading ? 'Reset...' : 'Reset Password'}
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-primary hover:underline">
                  Torna al Login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

