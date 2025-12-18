'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiUrl } from '@/lib/api'

export default function SubscriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const plans = [
    {
      id: 'monthly',
      name: 'Piano Mensile',
      price: 29.99,
      period: 'mese',
      icon: '🎫',
      popular: false,
      features: [
        'Accesso completo al Network',
        'Link di referral personale',
        'Commissioni 20% su ogni nuovo affiliato',
        'Dashboard Network completa',
        'Supporto prioritario',
      ],
    },
    {
      id: 'annual',
      name: 'Piano Annuale',
      price: 299.99,
      period: 'anno',
      icon: '🏆',
      popular: true,
      savings: 'Risparmia 17%',
      features: [
        'Tutto del piano mensile',
        'Risparmio del 17%',
        'Supporto VIP',
        'Aggiornamenti prioritari',
        'Webinar esclusivi',
      ],
    },
  ]

  const handleSubscribe = async (planId: string) => {
    if (loading) return // Prevenire click multipli
    
    setLoading(planId)
    
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        alert('Devi essere loggato per attivare un abbonamento')
        window.location.href = '/login'
        return
      }

      console.log('Attivazione abbonamento:', planId)
      
      const response = await fetch(
        apiUrl('/api/subscription/create-checkout'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ planId }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Errore nella richiesta')
      }

      const data = await response.json()
      console.log('Risposta server:', data)

      if (data.success) {
        // Abbonamento attivato direttamente (senza Stripe)
        console.log('✅ Abbonamento attivato con successo!', data)
        alert('✅ Abbonamento attivato con successo! Ora puoi accedere al Network.')
        // Ricarica la pagina dopo 1 secondo per aggiornare lo stato
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
      } else if (data.checkoutUrl) {
        // Redirect a Stripe checkout
        window.location.href = data.checkoutUrl
      } else {
        const errorMsg = data.message || 'Errore sconosciuto'
        console.error('❌ Errore abbonamento:', errorMsg)
        alert('Errore nell\'attivazione dell\'abbonamento: ' + errorMsg)
      }
    } catch (err: any) {
      console.error('Error creating checkout:', err)
      alert('Errore: ' + (err.message || 'Errore di connessione. Riprova.'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Attiva il Network Marketing
          </h1>
          <p className="text-text-secondary text-lg">
            Scegli il piano perfetto per te e inizia a guadagnare
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    {plan.savings}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="text-5xl mb-4">{plan.icon}</div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  {plan.name}
                </h2>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-text-primary">
                    €{plan.price.toFixed(2)}
                  </span>
                  <span className="text-text-secondary ml-2">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={20} />
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`w-full btn-primary ${plan.popular ? 'bg-primary text-white' : 'btn-outline'} ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} font-medium rounded-full px-6 py-3 transition-colors duration-200`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!loading || loading === plan.id) {
                    handleSubscribe(plan.id)
                  }
                }}
                disabled={loading === plan.id}
              >
                {loading === plan.id
                  ? 'Attivazione in corso...'
                  : plan.popular
                  ? 'Attiva Piano Popolare'
                  : 'Attiva questo piano'}
              </button>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="bg-background">
          <h3 className="font-semibold text-text-primary mb-3">
            Cosa ottieni con l'abbonamento:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-secondary">
            <div className="flex items-start gap-2">
              <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={16} />
              <span>Accesso completo alla dashboard Network</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={16} />
              <span>Link di referral unico e tracciabile</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={16} />
              <span>Commissioni del 20% su ogni nuovo affiliato pagante</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={16} />
              <span>Visualizzazione in tempo reale delle commissioni</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={16} />
              <span>Gestione completa della tua rete di affiliati</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={16} />
              <span>Supporto dedicato per il Network</span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

