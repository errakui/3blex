'use client'

import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Package, Truck, CheckCircle, Clock } from 'lucide-react'

interface Order {
  id: number
  order_number: string
  total: number
  status: string
  tracking_number: string | null
  created_at: string
  user_name: string
  user_email: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(
        apiUrl('/api/admin/orders'),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) {
        if (response.status === 403) {
          window.location.href = '/dashboard'
          return
        }
      }

      const data = await response.json()
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, status: string, tracking?: string) => {
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(
        apiUrl('/api/admin/orders/${orderId}/status'),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            status,
            trackingNumber: tracking || null,
          }),
        }
      )

      if (response.ok) {
        setEditingOrder(null)
        setTrackingNumber('')
        fetchOrders()
      }
    } catch (err) {
      console.error('Error updating order:', err)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Gestione Ordini
          </h1>
          <p className="text-text-secondary">
            Gestisci tutti gli ordini del sistema
          </p>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Ordine
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Totale
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Stato
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Tracking
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Data
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-background">
                    <td className="py-4 px-4 font-medium text-text-primary">
                      #{order.order_number}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-text-primary">{order.user_name}</p>
                        <p className="text-sm text-text-secondary">{order.user_email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-text-primary">
                      €{parseFloat(order.total.toString()).toFixed(2)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-600'
                            : order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-600'
                            : order.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-600'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {order.status === 'delivered'
                          ? 'Consegnato'
                          : order.status === 'shipped'
                          ? 'Spedito'
                          : order.status === 'processing'
                          ? 'In elaborazione'
                          : order.status === 'cancelled'
                          ? 'Cancellato'
                          : 'In attesa'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-text-secondary text-sm">
                      {order.tracking_number || '-'}
                    </td>
                    <td className="py-4 px-4 text-text-secondary text-sm">
                      {new Date(order.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td className="py-4 px-4">
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'processing')}
                            >
                              Elabora
                            </Button>
                          )}
                          {order.status === 'processing' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingOrder(order)
                                setTrackingNumber('')
                              }}
                            >
                              Spedisci
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                            >
                              Segna consegnato
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12 text-text-secondary">
              <Package className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
              <p>Nessun ordine trovato</p>
            </div>
          )}
        </Card>

        {editingOrder && (
          <Card>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Spedisci Ordine #{editingOrder.order_number}
            </h2>
            <div className="space-y-4">
              <Input
                label="Numero di Tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="ABC123456789"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    updateOrderStatus(editingOrder.id, 'shipped', trackingNumber)
                  }}
                  disabled={!trackingNumber}
                >
                  <Truck size={18} className="mr-2" />
                  Spedisci con Tracking
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingOrder(null)
                    setTrackingNumber('')
                  }}
                >
                  Annulla
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

