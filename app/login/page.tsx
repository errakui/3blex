'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Eye, EyeOff, Shield } from 'lucide-react'
import { apiUrl } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        apiUrl('/api/auth/login'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Errore durante il login')
        setLoading(false)
        return
      }

      // Check if 2FA required
      if (data.requires2FA) {
        setRequires2FA(true)
        setLoading(false)
        return
      }

      localStorage.setItem('token', data.token)
      router.push('/dashboard')
    } catch (err) {
      setError('Errore di connessione. Riprova.')
      setLoading(false)
    }
  }

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!twoFactorToken || twoFactorToken.length !== 6) {
      setError('Inserisci un codice a 6 cifre')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        apiUrl('/api/auth/login'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, twoFactorToken }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Codice 2FA non valido')
        setLoading(false)
        return
      }

      localStorage.setItem('token', data.token)
      router.push('/dashboard')
    } catch (err) {
      setError('Errore di connessione. Riprova.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/assets/logo.png"
            alt="3Blex Logo"
            width={180}
            height={180}
            className="mx-auto mb-6 rounded-lg"
            unoptimized
          />
          <h1 className="text-2xl font-semibold text-text-primary mb-1.5">
            Benvenuto in 3Blex
          </h1>
          <p className="text-sm text-text-secondary">
            {requires2FA ? 'Inserisci il codice 2FA' : 'Accedi al tuo account per continuare'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-soft border border-border-light p-8">
          {!requires2FA ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50/50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="nome@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-10 text-text-secondary hover:text-primary"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <Link href="/reset-password" className="text-sm text-primary hover:underline">
                  Password dimenticata?
                </Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Accesso...' : 'Accedi'}
              </Button>

              <div className="text-center text-sm text-text-secondary">
                Non hai un account?{' '}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Registrati
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handle2FAVerify} className="space-y-6">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="text-primary" size={24} />
                </div>
                <h2 className="text-lg font-semibold text-text-primary mb-1.5">
                  Autenticazione a Due Fattori
                </h2>
                <p className="text-xs text-text-secondary">
                  Inserisci il codice a 6 cifre dalla tua app di autenticazione
                </p>
              </div>

              {error && (
                <div className="bg-red-50/50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Codice 2FA
                </label>
                <Input
                  type="text"
                  value={twoFactorToken}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setTwoFactorToken(value)
                    setError('')
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest"
                  required
                />
              </div>

              <Button type="submit" disabled={loading || twoFactorToken.length !== 6} className="w-full">
                {loading ? 'Verifica...' : 'Verifica e Accedi'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRequires2FA(false)
                  setTwoFactorToken('')
                  setError('')
                }}
                className="w-full"
              >
                Indietro
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
