'use client'

import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageSquare, Plus, Check, X, Clock } from 'lucide-react'

interface Ticket {
  id: number
  userId: number
  userName: string
  userEmail: string
  subject: string
  message: string
  status: string
  priority: string
  createdAt: string
  assignedTo?: number
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyMessage, setReplyMessage] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/admin/support-tickets'),
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

  const handleUpdateStatus = async (ticketId: number, status: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(
        apiUrl('/api/admin/support-tickets/${ticketId}/status'),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      )
      fetchTickets()
    } catch (error) {
      console.error('Error updating ticket:', error)
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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-600',
      medium: 'bg-yellow-100 text-yellow-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    }
    return colors[priority] || 'bg-gray-100 text-gray-600'
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
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <MessageSquare className="text-primary" size={32} />
            Support Tickets
          </h1>
          <p className="text-text-secondary">
            Gestisci i ticket di supporto degli utenti
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-2 space-y-4">
            {tickets.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
                  <p className="text-text-secondary">Nessun ticket disponibile</p>
                </div>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="cursor-pointer"
                >
                <Card
                  className={`hover:shadow-lg transition-shadow ${
                    selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-text-primary">{ticket.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                        {ticket.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span>{ticket.userName}</span>
                        <span>•</span>
                        <span>{ticket.userEmail}</span>
                        <span>•</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString('it-IT')}</span>
                      </div>
                    </div>
                  </div>
                </Card>
                </div>
              ))
            )}
          </div>

          {/* Ticket Details */}
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <Card>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      {selectedTicket.subject}
                    </h3>
                    <div className="flex gap-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-text-primary mb-1">Da:</p>
                    <p className="text-sm text-text-secondary">{selectedTicket.userName}</p>
                    <p className="text-sm text-text-secondary">{selectedTicket.userEmail}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-text-primary mb-1">Messaggio:</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">
                      {selectedTicket.message}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-primary">Cambia Status:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                      >
                        In Progress
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                      >
                        Risolto
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                      >
                        Chiuso
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <p className="text-text-secondary">Seleziona un ticket per vedere i dettagli</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

