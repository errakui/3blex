'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Package, Truck, CheckCircle, Clock, X } from 'lucide-react'
import Link from 'next/link'
import { apiUrl } from '@/lib/api'

interface Order {
  id: number
  orderNumber: string
  date: string
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: Array<{
    id: number
    name: string
    quantity: number
    price: number
  }>
  trackingNumber?: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all')

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token')
      
      try {
        const response = await fetch(
          apiUrl('/api/orders'),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        const data = await response.json()
        const ordersWithItems = await Promise.all(
          (data.orders || []).map(async (order: any) => {
            const orderDetailResponse = await fetch(
              apiUrl('/api/orders/${order.id}'),
              { headers: { Authorization: `Bearer ${token}` } }
            )
            const orderDetail = await orderDetailResponse.json()
            return {
              ...order,
              date: order.createdAt,
              items: orderDetail.order?.items || []
            }
          })
        )
        setOrders(ordersWithItems)
      } catch (err) {
        console.error('Error fetching orders:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="text-green-500" size={20} />
      case 'shipped':
        return <Truck className="text-blue-500" size={20} />
      case 'processing':
        return <Package className="text-yellow-500" size={20} />
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />
      case 'cancelled':
        return <X className="text-red-500" size={20} />
      default:
        return <Package className="text-text-secondary" size={20} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return { text: 'Consegnato', color: 'bg-green-100 text-green-600' }
      case 'shipped':
        return { text: 'Spedito', color: 'bg-blue-100 text-blue-600' }
      case 'processing':
        return { text: 'In elaborazione', color: 'bg-yellow-100 text-yellow-600' }
      case 'pending':
        return { text: 'In attesa', color: 'bg-yellow-100 text-yellow-600' }
      case 'cancelled':
        return { text: 'Cancellato', color: 'bg-red-100 text-red-600' }
      default:
        return { text: 'Sconosciuto', color: 'bg-gray-100 text-gray-600' }
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true
    return order.status === filter
  })

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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            I miei ordini
          </h1>
          <p className="text-text-secondary">
            Visualizza lo stato dei tuoi ordini e il tracking
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex items-center gap-2 flex-wrap">
            <Chip
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              Tutti
            </Chip>
            <Chip
              active={filter === 'pending'}
              onClick={() => setFilter('pending')}
            >
              In attesa
            </Chip>
            <Chip
              active={filter === 'processing'}
              onClick={() => setFilter('processing')}
            >
              In elaborazione
            </Chip>
            <Chip
              active={filter === 'shipped'}
              onClick={() => setFilter('shipped')}
            >
              Spediti
            </Chip>
            <Chip
              active={filter === 'delivered'}
              onClick={() => setFilter('delivered')}
            >
              Consegnati
            </Chip>
          </div>
        </Card>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusText(order.status)
              
              return (
                <Card key={order.id}>
                  <Link href={`/orders/${order.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-1">
                          Ordine #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {new Date(order.date).toLocaleDateString('it-IT', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {order.trackingNumber && (
                          <p className="text-sm text-text-secondary mt-1">
                            Tracking: {order.trackingNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-text-primary mb-2">
                        €{order.total.toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-semibold text-text-primary mb-2">
                      Prodotti ordinati:
                    </h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-text-primary">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="text-text-secondary">
                            €{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.status === 'shipped' && order.trackingNumber && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button variant="outline" className="w-full">
                        <Truck size={18} className="mr-2" />
                        Traccia spedizione
                      </Button>
                    </div>
                  )}
                  </Link>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Package className="mx-auto mb-4 text-text-secondary opacity-50" size={64} />
            <p className="text-text-secondary text-lg">
              Nessun ordine trovato
            </p>
            <p className="text-text-secondary text-sm mt-2">
              I tuoi ordini appariranno qui
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

