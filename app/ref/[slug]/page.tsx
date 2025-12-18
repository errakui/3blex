'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ShoppingBag, UserPlus, ArrowRight, Store, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiUrl } from '@/lib/api'

export default function ReferralLandingPage() {
  const params = useParams()
  const slug = params.slug as string
  const [linkInfo, setLinkInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      fetchLinkInfo()
    }
  }, [slug])

  const fetchLinkInfo = async () => {
    try {
      const response = await fetch(
        apiUrl('/api/referral-links/info/${slug}')
      )
      const data = await response.json()
      if (data.success) {
        setLinkInfo(data.link)
        // Track click
        await fetch(
          apiUrl('/api/referral-links/track/${slug}'),
          { method: 'GET' }
        )
      }
    } catch (error) {
      console.error('Error fetching link info:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!linkInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Link Non Valido</h1>
          <p className="text-text-secondary mb-6">Il link di referral non è valido o è scaduto.</p>
          <Link href="/">
            <Button>Torna alla Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/logo.png"
              alt="3Blex Logo"
              width={60}
              height={60}
              className="rounded-lg"
              unoptimized
            />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-primary/5 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Benvenuto in 3Blex!
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            Scegli come vuoi iniziare
          </p>
        </div>
      </div>

      {/* Dual Path Options */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Option 1: Register as Affiliate */}
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="text-primary" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                Diventa Affiliato
              </h2>
              <p className="text-text-secondary">
                Unisciti al network e inizia a guadagnare commissioni
              </p>
            </div>

            <ul className="space-y-3 mb-6 text-left">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={18} />
                <span className="text-text-secondary">Accesso completo al network</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={18} />
                <span className="text-text-secondary">Dashboard commissioni</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={18} />
                <span className="text-text-secondary">Strumenti marketing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={18} />
                <span className="text-text-secondary">Supporto dedicato</span>
              </li>
            </ul>

            <Link href={`/register?ref=${slug}`}>
              <Button className="w-full flex items-center justify-center gap-2" size="lg">
                Registrati come Affiliato
                <ArrowRight size={18} />
              </Button>
            </Link>
          </Card>

          {/* Option 2: Shop as Customer */}
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="text-blue-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                Acquista come Cliente
              </h2>
              <p className="text-text-secondary">
                Sfoglia il catalogo e acquista senza registrazione
              </p>
            </div>

            <ul className="space-y-3 mb-6 text-left">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={18} />
                <span className="text-text-secondary">Nessuna registrazione richiesta</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={18} />
                <span className="text-text-secondary">Checkout rapido</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={18} />
                <span className="text-text-secondary">Prodotti selezionati</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={18} />
                <span className="text-text-secondary">Puoi diventare affiliato dopo</span>
              </li>
            </ul>

            <Link href={`/customer?ref=${slug}`}>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2" size="lg">
                Vai al Marketplace
                <Store size={18} />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

