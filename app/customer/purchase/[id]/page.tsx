'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { apiUrl } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ShoppingBag, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  description: string
  price: number
  image: string
  stock: number
}

export default function CustomerPurchasePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const referralCode = searchParams?.get('ref') || ''
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(
        apiUrl('/api/products/public/${id}')
      )
      const data = await response.json()
      if (data.product) {
        setProduct(data.product)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || quantity < 1) return

    setProcessing(true)
    try {
      const response = await fetch(
        apiUrl('/api/orders/customer'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode,
            customerData,
            items: [{
              productId: product.id,
              quantity
            }]
          })
        }
      )

      const data = await response.json()
      if (data.success) {
        // Redirect to payment or success
        if (data.paymentLink) {
          window.location.href = data.paymentLink
        } else {
          alert('✅ Ordine creato! Riceverai una email di conferma.')
          window.location.href = '/customer?ref=' + referralCode
        }
      } else {
        alert('❌ Errore: ' + (data.message || 'Errore nella creazione dell\'ordine'))
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('❌ Errore nella creazione dell\'ordine')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Prodotto Non Trovato</h1>
          <Link href="/customer">
            <Button>Torna al Marketplace</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/customer" className="flex items-center gap-2 text-text-secondary hover:text-primary">
            <ArrowLeft size={18} />
            Torna al Marketplace
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Info */}
          <Card>
            <div className="p-6">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                  unoptimized
                />
              ) : (
                <div className="w-full h-64 bg-background rounded-lg flex items-center justify-center mb-4">
                  <ShoppingBag className="text-text-secondary opacity-30" size={64} />
                </div>
              )}
              
              <h1 className="text-2xl font-bold text-text-primary mb-2">{product.name}</h1>
              <p className="text-text-secondary mb-4">{product.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm text-text-secondary">Prezzo</span>
                <span className="text-3xl font-bold text-text-primary">€{product.price.toFixed(2)}</span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <span className="text-sm text-text-secondary">Quantità:</span>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={product.stock}
                  className="w-20 px-3 py-2 border border-border rounded-lg"
                />
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Totale</span>
                  <span>€{(product.price * quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Checkout Form */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-text-primary mb-6">Dati di Spedizione</h2>
              <form onSubmit={handlePurchase} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Nome Completo *
                  </label>
                  <Input
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Telefono *
                  </label>
                  <Input
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Indirizzo *
                  </label>
                  <Input
                    value={customerData.address}
                    onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Città *
                    </label>
                    <Input
                      value={customerData.city}
                      onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      CAP *
                    </label>
                    <Input
                      value={customerData.postalCode}
                      onChange={(e) => setCustomerData({ ...customerData, postalCode: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Paese *
                  </label>
                  <Input
                    value={customerData.country}
                    onChange={(e) => setCustomerData({ ...customerData, country: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={processing || product.stock === 0}
                  className="w-full py-6 text-lg"
                >
                  {processing ? 'Elaborazione...' : `Acquista per €${(product.price * quantity).toFixed(2)}`}
                </Button>

                <p className="text-xs text-text-secondary text-center">
                  Continuando, accetti i termini e condizioni
                </p>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

