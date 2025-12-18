'use client'

import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ShoppingBag, Plus, Search, Mail, Phone, User } from 'lucide-react'

interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  totalOrders: number
  totalSpent: number
  lastOrderDate?: string
}

export default function ManageCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    productId: '',
    quantity: 1
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/admin/customers'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      if (data.success) {
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/orders/for-customer'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            items: [{
              productId: parseInt(formData.productId),
              quantity: formData.quantity
            }]
          })
        }
      )

      const data = await response.json()
      if (data.success) {
        alert('✅ Ordine creato! Link di pagamento: ' + data.paymentLink)
        setShowCreateModal(false)
        setFormData({ name: '', email: '', phone: '', productId: '', quantity: 1 })
        fetchCustomers()
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('❌ Errore nella creazione dell\'ordine')
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <ShoppingBag className="text-primary" size={32} />
              Acquista per Cliente
            </h1>
            <p className="text-text-secondary">
              Crea ordini per conto dei tuoi clienti
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Nuovo Ordine Cliente
          </Button>
        </div>

        {/* Search */}
        <Card>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca cliente per nome o email..."
              className="pl-10"
            />
          </div>
        </Card>

        {/* Customers List */}
        {filteredCustomers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <User className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
              <p className="text-text-secondary">Nessun cliente trovato</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id}>
                <div className="p-4">
                  <h3 className="font-semibold text-text-primary mb-2">{customer.name}</h3>
                  <div className="space-y-1 text-sm text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span>{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Ordini:</span>
                      <span className="font-medium text-text-primary">{customer.totalOrders}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-text-secondary">Totale speso:</span>
                      <span className="font-medium text-text-primary">€{customer.totalSpent.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        name: customer.name,
                        email: customer.email,
                        phone: customer.phone || ''
                      })
                      setShowCreateModal(true)
                    }}
                  >
                    Crea Ordine
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Order Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full">
              <h2 className="text-xl font-bold text-text-primary mb-4">Crea Ordine per Cliente</h2>
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Nome Cliente
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email Cliente
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Telefono Cliente
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    ID Prodotto
                  </label>
                  <Input
                    type="number"
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Quantità
                  </label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    min={1}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      setFormData({ name: '', email: '', phone: '', productId: '', quantity: 1 })
                    }}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                  <Button type="submit" className="flex-1">
                    Crea Ordine
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

