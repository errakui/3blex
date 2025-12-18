'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Check, ArrowRight } from 'lucide-react'
import { apiUrl } from '@/lib/api'

function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    referralCode: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const refCode = searchParams?.get('ref')
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }))
    }
  }, [searchParams])

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
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone || undefined,
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

      // Mostra pagina conferma email
      setUserEmail(formData.email)
      setRegistrationComplete(true)
      localStorage.setItem('token', data.token)

    } catch (err) {
      setError('Errore di connessione. Riprova.')
      setLoading(false)
    }
  }

  // Pagina di conferma registrazione
  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center"
          >
            <Mail className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Controlla la tua email! 📧
          </h1>
          
          <p className="text-slate-500 mb-6">
            Abbiamo inviato un link di verifica a:
          </p>
          
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-brand-600 font-semibold">{userEmail}</p>
          </div>
          
          <p className="text-sm text-slate-500 mb-6">
            Clicca sul link nell'email per attivare il tuo account. 
            Il link scadrà tra 24 ore.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              💡 <strong>Non trovi l'email?</strong> Controlla la cartella spam o posta indesiderata.
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/onboarding')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
            >
              Continua con Onboarding
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <Link
              href="/login"
              className="block w-full px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Vai al Login
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Image 
            src="/assets/logo.png" 
            alt="3Blex Logo" 
            width={80} 
            height={80} 
            className="mx-auto mb-4 rounded-2xl shadow-lg shadow-brand-500/30"
          />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Crea il tuo account
          </h1>
          <p className="text-slate-500">
            Inizia la tua avventura con 3Blex Network
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nome"
                type="text"
                name="firstName"
                placeholder="Mario"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Cognome"
                type="text"
                name="lastName"
                placeholder="Rossi"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="nome@esempio.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Telefono (opzionale)"
              type="tel"
              name="phone"
              placeholder="+39 333 1234567"
              value={formData.phone}
              onChange={handleChange}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Minimo 8 caratteri"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-10 text-slate-400 hover:text-brand-500 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Input
              label="Conferma Password"
              type="password"
              name="confirmPassword"
              placeholder="Ripeti la password"
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

            <div className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                required
              />
              <span className="text-slate-500">
                Accetto i{' '}
                <Link href="/terms" className="text-brand-600 hover:underline">
                  termini e condizioni
                </Link>{' '}
                e la{' '}
                <Link href="/privacy" className="text-brand-600 hover:underline">
                  privacy policy
                </Link>
              </span>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700" 
              disabled={loading}
            >
              {loading ? 'Registrazione...' : 'Crea Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">Hai già un account? </span>
            <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
              Accedi
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function RegisterPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    }>
      <RegisterPage />
    </Suspense>
  )
}
