'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { apiUrl } from '@/lib/api'
function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  })
  
  useEffect(() => {
    // Precompila il codice referral se presente nell'URL
    const refCode = searchParams?.get('ref')
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }))
    }
  }, [searchParams])
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Le password non corrispondono')
      return
    }

    if (formData.password.length < 8) {
      setError('La password deve essere di almeno 8 caratteri')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        apiUrl('/api/auth/register'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            referralCode: formData.referralCode || undefined,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Errore durante la registrazione')
        setLoading(false)
        return
      }

      localStorage.setItem('token', data.token)
      router.push('/onboarding')
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
            className="mx-auto mb-4 rounded-lg"
            unoptimized
          />
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Crea il tuo account
          </h1>
          <p className="text-text-secondary">
            Inizia la tua avventura con 3Blex
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <Input
              label="Nome completo"
              type="text"
              name="name"
              placeholder="Mario Rossi"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="nome@esempio.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
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

            <Input
              label="Conferma Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <Input
              label="Codice Referral (opzionale)"
              type="text"
              name="referralCode"
              placeholder="ABC123"
              value={formData.referralCode}
              onChange={handleChange}
            />

            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 rounded border-border"
                required
              />
              <span className="text-text-secondary">
                Accetto i{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  termini e condizioni
                </Link>{' '}
                e la{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  privacy policy
                </Link>
              </span>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-text-secondary">Hai già un account? </span>
            <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
              Accedi
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <RegisterPage />
    </Suspense>
  )
}

