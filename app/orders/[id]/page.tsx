'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Package, Truck, CheckCircle, Clock, X, Download } from 'lucide-react'
import Link from 'next/link'
import { apiUrl } from '@/lib/api'

interface Order {
  id: number
  orderNumber: string
  total: number
  status: string
  trackingNumber?: string
  createdAt: string
  items: Array<{
    id: number
    productName: string
    quantity: number
    price: number
  }>
}

interface Tracking {
  trackingNumber: string
  carrier: string
  status: string
  trackingUrl?: string
  events?: Array<{
    date: string
    status: string
    location: string
    description: string
  }>
}

export default function OrderDetailPage() {
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [tracking, setTracking] = useState<Tracking | null>(null)
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string)
      fetchTracking(params.id as string)
      fetchInvoice(params.id as string)
    }
  }, [params.id])

  const fetchOrder = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/orders/${id}'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      if (data.order) {
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTracking = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/tracking/${id}'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      if (data.success && data.tracking) {
        setTracking(data.tracking)
      }
    } catch (error) {
      console.error('Error fetching tracking:', error)
    }
  }

  const fetchInvoice = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/invoices/${id}'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      if (data.success && data.invoice) {
        setInvoice(data.invoice)
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    }
  }

  const handleGenerateInvoice = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/invoices/${params.id}/generate'),
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const data = await response.json()
      if (data.success) {
        alert('✅ Fattura generata!')
        fetchInvoice(params.id as string)
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      alert('❌ Errore nella generazione della fattura')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="text-green-500" size={24} />
      case 'processing':
      case 'shipped':
        return <Truck className="text-blue-500" size={24} />
      case 'cancelled':
        return <X className="text-red-500" size={24} />
      default:
        return <Clock className="text-yellow-500" size={24} />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'In Attesa',
      processing: 'In Elaborazione',
      shipped: 'Spedito',
      delivered: 'Consegnato',
      cancelled: 'Annullato'
    }
    return labels[status] || status
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

  if (!order) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-12">
            <p className="text-text-secondary">Ordine non trovato</p>
            <Link href="/orders">
              <Button variant="outline" className="mt-4">
                Torna agli Ordini
              </Button>
            </Link>
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <Link href="/orders">
          <Button variant="outline">
            ← Torna agli Ordini
          </Button>
        </Link>

        <Card>
          <div className="p-6 space-y-6">
            {/* Order Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  Ordine #{order.orderNumber}
                </h1>
                <p className="text-sm text-text-secondary">
                  Data: {new Date(order.createdAt).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusIcon(order.status)}
                <span className="px-4 py-2 bg-primary-light text-primary rounded-full font-medium">
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Prodotti</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-text-primary">{item.productName}</p>
                      <p className="text-sm text-text-secondary">
                        Quantità: {item.quantity} × €{item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-text-primary">
                      €{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking */}
            {tracking && tracking.trackingNumber && (
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Truck className="text-primary" size={20} />
                    <div>
                      <p className="font-medium text-text-primary">Tracking Number</p>
                      <p className="font-mono text-sm text-text-secondary">{tracking.trackingNumber}</p>
                    </div>
                  </div>
                  {tracking.trackingUrl && (
                    <a
                      href={tracking.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Traccia Spedizione →
                    </a>
                  )}
                </div>
                
                {tracking.events && tracking.events.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {tracking.events.map((event, index) => (
                      <div key={index} className="text-sm text-text-secondary">
                        <span className="font-medium">{new Date(event.date).toLocaleDateString('it-IT')}</span>
                        {' - '}
                        <span>{event.description}</span>
                        {event.location && (
                          <span className="text-xs text-text-secondary"> ({event.location})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Invoice */}
            <div className="p-4 bg-background rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary mb-1">Fattura</p>
                  {invoice?.issued ? (
                    <p className="text-sm text-text-secondary">
                      Fattura #{invoice.invoiceNumber} generata
                    </p>
                  ) : (
                    <p className="text-sm text-text-secondary">
                      Fattura non ancora generata
                    </p>
                  )}
                </div>
                {invoice?.issued && invoice.downloadUrl ? (
                  <a
                    href={invoice.downloadUrl}
                    download
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Download size={18} />
                    Scarica PDF
                  </a>
                ) : (
                  <Button variant="outline" onClick={handleGenerateInvoice}>
                    Genera Fattura
                  </Button>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-text-primary">Totale</p>
                <p className="text-2xl font-bold text-text-primary">
                  €{order.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
