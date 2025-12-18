'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageSquare, Plus, Check, Clock, AlertCircle } from 'lucide-react'
import { apiUrl } from '@/lib/api'

interface Ticket {
  id: number
  subject: string
  message: string
  status: string
  priority: string
  createdAt: string
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/support-tickets/my-tickets'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      if (data.success) {
        setTickets(data.tickets)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/support-tickets/create'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      )

      const data = await response.json()
      if (data.success) {
        setShowCreateModal(false)
        setFormData({ subject: '', message: '', priority: 'medium' })
        fetchTickets()
        alert('✅ Ticket creato con successo!')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      alert('❌ Errore nella creazione del ticket')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-100 text-red-600',
      'in_progress': 'bg-yellow-100 text-yellow-600',
      resolved: 'bg-green-100 text-green-600',
      closed: 'bg-gray-100 text-gray-600'
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Aperto',
      'in_progress': 'In Elaborazione',
      resolved: 'Risolto',
      closed: 'Chiuso'
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <MessageSquare className="text-primary" size={32} />
              Supporto
            </h1>
            <p className="text-text-secondary">
              Contatta il supporto o visualizza i tuoi ticket
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Nuovo Ticket
          </Button>
        </div>

        {tickets.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <MessageSquare className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
              <p className="text-text-secondary mb-4">Nessun ticket creato</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Crea il tuo primo ticket
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary">{ticket.subject}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </div>
                    <p className="text-text-secondary mb-3 whitespace-pre-wrap">{ticket.message}</p>
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>{new Date(ticket.createdAt).toLocaleDateString('it-IT')}</span>
                      </div>
                      <span>•</span>
                      <span>Priorità: {ticket.priority}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full">
              <h2 className="text-xl font-bold text-text-primary mb-4">Nuovo Ticket di Supporto</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Oggetto
                  </label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Descrivi brevemente il problema"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Messaggio
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Descrivi in dettaglio il problema o la richiesta..."
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Priorità
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">Bassa</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      setFormData({ subject: '', message: '', priority: 'medium' })
                    }}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                  <Button type="submit" className="flex-1">
                    Invia Ticket
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

