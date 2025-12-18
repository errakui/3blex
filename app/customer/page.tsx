'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ShoppingBag, ArrowRight, Tag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { apiUrl } from '@/lib/api'

interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice: number
  category: string
  image: string
  stock: number
}

function CustomerModePage() {
  const searchParams = useSearchParams()
  const referralCode = searchParams?.get('ref') || ''
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // Customer mode - no auth required, public products
      const response = await fetch(apiUrl('/api/products/public'))
      const data = await response.json()
      if (data.products) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNow = (productId: number) => {
    // Redirect to purchase page with referral code
    window.location.href = `/customer/purchase/${productId}?ref=${referralCode}`
  }

  const handleUpgradeToAffiliate = () => {
    window.location.href = `/register?ref=${referralCode}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border-light sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/logo.png"
              alt="3Blex Logo"
              width={120}
              height={120}
              className="rounded-lg"
              unoptimized
            />
          </Link>
          <Button onClick={handleUpgradeToAffiliate} variant="outline" size="sm">
            Diventa Affiliato
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-primary/5 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-semibold text-text-primary mb-2">
            Benvenuto nel Marketplace 3Blex
          </h1>
          <p className="text-sm text-text-secondary">
            Scopri i nostri prodotti e offerte speciali
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-1">Catalogo Prodotti</h2>
          <p className="text-sm text-text-secondary">Scegli tra i nostri prodotti selezionati</p>
        </div>

        {products.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
              <p className="text-text-secondary">Nessun prodotto disponibile</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const hasDiscount = product.originalPrice > product.price

              return (
                <Card key={product.id} className="card-hover overflow-hidden">
                  <div className="relative w-full">
                    {product.image ? (
                      <div className="w-full min-h-[280px] bg-background-subtle rounded-t-lg flex items-center justify-center overflow-hidden p-6">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={500}
                          height={500}
                          className="w-auto h-auto max-w-full max-h-[380px] object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-background-subtle rounded-t-lg flex items-center justify-center">
                        <ShoppingBag className="text-text-secondary opacity-30" size={48} />
                      </div>
                    )}

                    {hasDiscount && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-md text-xs font-medium">
                        Sconto
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-semibold text-text-primary mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-text-secondary mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {hasDiscount && (
                          <p className="text-xs text-text-tertiary line-through">
                            €{product.originalPrice.toFixed(2)}
                          </p>
                        )}
                        <p className="text-xl font-semibold text-text-primary">
                          €{product.price.toFixed(2)}
                        </p>
                      </div>
                      {product.stock > 0 ? (
                        <span className="text-xs text-green-600 font-medium">Disponibile</span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">Esaurito</span>
                      )}
                    </div>

                    <Button
                      onClick={() => handleBuyNow(product.id)}
                      disabled={product.stock === 0}
                      className="w-full flex items-center justify-center gap-2 text-xs"
                    >
                      Acquista Ora
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* CTA Upgrade */}
        <Card className="mt-12 bg-primary/5 border-primary/30">
          <div className="p-8 text-center">
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Vuoi guadagnare con 3Blex?
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              Diventa un affiliato e guadagna commissioni su ogni vendita!
            </p>
            <Button onClick={handleUpgradeToAffiliate}>
              Diventa Affiliato Gratis
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function CustomerModePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <CustomerModePage />
    </Suspense>
  )
}

