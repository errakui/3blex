'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ShoppingBag, Tag, ArrowLeft, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiUrl } from '@/lib/api'

interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice: number
  priceVip?: number
  priceAffiliate?: number
  category: string
  image: string
  stock: number
  isPackage: boolean
  packageType?: string
  isDigital: boolean
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  const fetchProduct = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/products/${id}'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      if (data) {
        setProduct(data)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product || quantity < 1) return

    setAdding(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/orders'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            items: [{
              productId: product.id,
              quantity: quantity,
              price: product.price
            }]
          })
        }
      )

      const data = await response.json()
      if (response.ok) {
        alert('✅ Ordine creato con successo!')
        router.push('/orders')
      } else {
        alert('❌ Errore: ' + (data.message || 'Errore nella creazione dell\'ordine'))
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('❌ Errore nella creazione dell\'ordine')
    } finally {
      setAdding(false)
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

  if (!product) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-12">
            <p className="text-text-secondary">Prodotto non trovato</p>
            <Link href="/products">
              <Button variant="outline" className="mt-4">
                Torna al Catalogo
              </Button>
            </Link>
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  const hasDiscount = product.originalPrice > product.price

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <Link href="/products">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft size={18} />
            Torna al Catalogo
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <Card>
            <div className="relative w-full min-h-[500px] bg-background rounded-xl overflow-hidden p-8 flex items-center justify-center">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-auto h-auto max-w-full max-h-[600px] object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-background rounded-xl flex items-center justify-center">
                  <ShoppingBag className="text-text-secondary opacity-30" size={128} />
                </div>
              )}
            </div>
          </Card>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {product.isPackage && (
                  <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium">
                    Pacchetto
                  </span>
                )}
                {product.isDigital && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    Digitale
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">{product.name}</h1>
              <p className="text-text-secondary text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Price */}
            <div>
              {hasDiscount && (
                <p className="text-text-secondary line-through mb-1">
                  €{product.originalPrice.toFixed(2)}
                </p>
              )}
              <p className="text-4xl font-bold text-text-primary">
                €{product.price.toFixed(2)}
              </p>
              {hasDiscount && (
                <p className="text-green-600 font-medium mt-1">
                  Risparmi €{(product.originalPrice - product.price).toFixed(2)}!
                </p>
              )}
            </div>

            {/* Stock */}
            <div>
              {product.stock > 0 ? (
                <p className="text-green-600 font-medium">
                  ✓ Disponibile ({product.stock} pezzi)
                </p>
              ) : (
                <p className="text-red-600 font-medium">✗ Esaurito</p>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <label className="font-medium text-text-primary">Quantità:</label>
                <div className="flex items-center gap-3 border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-background rounded-l-lg"
                  >
                    <Minus size={18} />
                  </button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center border-0"
                    min={1}
                    max={product.stock}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 hover:bg-background rounded-r-lg"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            {product.stock > 0 && (
              <Button
                onClick={handleAddToCart}
                disabled={adding}
                className="w-full flex items-center justify-center gap-2 py-6 text-lg"
              >
                <ShoppingBag size={20} />
                {adding ? 'Aggiunta...' : `Acquista per €${(product.price * quantity).toFixed(2)}`}
              </Button>
            )}

            {/* Category */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-text-secondary">
                Categoria: <span className="font-medium text-text-primary">{product.category}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
