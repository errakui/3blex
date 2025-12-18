'use client'

import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ShoppingBag, Tag, Star, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/auth/me'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      if (data.user) {
        setUserRole(data.user.role)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/products'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
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

  const getPriceBadge = (product: Product) => {
    const isAffiliate = userRole === 'network_member' || userRole === 'admin'
    const isVip = false // TODO: implement VIP logic

    if (isAffiliate && product.priceAffiliate && product.priceAffiliate < product.originalPrice) {
      return {
        badge: 'Prezzo Affiliato',
        color: 'bg-green-100 text-green-600',
        price: product.priceAffiliate
      }
    }
    if (isVip && product.priceVip && product.priceVip < product.originalPrice) {
      return {
        badge: 'Prezzo VIP',
        color: 'bg-purple-100 text-purple-600',
        price: product.priceVip
      }
    }
    return null
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-1 flex items-center gap-2">
            <ShoppingBag className="text-primary" size={24} />
            Catalogo Prodotti
          </h1>
          <p className="text-sm text-text-secondary">
            Scegli tra i nostri prodotti e pacchetti
          </p>
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
              const priceBadge = getPriceBadge(product)
              const finalPrice = priceBadge?.price || product.price

              return (
                <Card key={product.id} className="card-hover overflow-hidden">
                  <Link href={`/products/${product.id}`}>
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

                      {priceBadge && (
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium ${priceBadge.color}`}>
                          {priceBadge.badge}
                        </div>
                      )}

                      {product.isPackage && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-white rounded-md text-xs font-medium">
                          Pacchetto
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-semibold text-text-primary line-clamp-2">
                          {product.name}
                        </h3>
                      </div>

                      <p className="text-xs text-text-secondary mb-4 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          {product.originalPrice > finalPrice && (
                            <p className="text-xs text-text-tertiary line-through">
                              €{product.originalPrice.toFixed(2)}
                            </p>
                          )}
                          <p className="text-xl font-semibold text-text-primary">
                            €{finalPrice.toFixed(2)}
                          </p>
                        </div>
                        {product.stock > 0 ? (
                          <span className="text-xs text-green-600 font-medium">
                            Disponibile
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium">
                            Esaurito
                          </span>
                        )}
                      </div>

                      <Button className="w-full flex items-center justify-center gap-2 text-xs">
                        Vedi Dettagli
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
