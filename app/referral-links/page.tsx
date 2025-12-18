'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Link as LinkIcon, Copy, Plus, Trash2, Edit2, Eye, TrendingUp } from 'lucide-react'
import { apiUrl } from '@/lib/api'

interface ReferralLink {
  id: number
  url: string
  slug: string
  type: string
  name: string
  clicks: number
  conversions: number
  conversionRate: number
  isActive: boolean
  createdAt: string
}

export default function ReferralLinksPage() {
  const [links, setLinks] = useState<ReferralLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newLink, setNewLink] = useState({
    type: 'registration',
    name: '',
    defaultAction: 'register'
  })

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/referral-links/my-links'),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      if (data.success) {
        setLinks(data.links)
      }
    } catch (error) {
      console.error('Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        apiUrl('/api/referral-links/create'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newLink)
        }
      )

      const data = await response.json()
      if (data.success) {
        setShowCreateModal(false)
        setNewLink({ type: 'registration', name: '', defaultAction: 'register' })
        fetchLinks()
      }
    } catch (error) {
      console.error('Error creating link:', error)
    }
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('Link copiato!')
  }

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(
        apiUrl('/api/referral-links/${id}'),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ isActive: !isActive })
        }
      )
      fetchLinks()
    } catch (error) {
      console.error('Error updating link:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo link?')) return

    try {
      const token = localStorage.getItem('token')
      await fetch(
        apiUrl('/api/referral-links/${id}'),
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      fetchLinks()
    } catch (error) {
      console.error('Error deleting link:', error)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      registration: 'Registrazione',
      product: 'Prodotto',
      funnel: 'Funnel',
      event: 'Evento',
      generic: 'Generico'
    }
    return labels[type] || type
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <LinkIcon className="text-primary" size={32} />
              I Miei Link Referral
            </h1>
            <p className="text-text-secondary">
              Crea e gestisci i tuoi link referral personalizzati
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Crea Link
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-1">Totale Link</p>
              <p className="text-2xl font-bold text-text-primary">{links.length}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-1">Totale Click</p>
              <p className="text-2xl font-bold text-text-primary">
                {links.reduce((sum, link) => sum + link.clicks, 0)}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-1">Conversioni</p>
              <p className="text-2xl font-bold text-text-primary">
                {links.reduce((sum, link) => sum + link.conversions, 0)}
              </p>
            </div>
          </Card>
        </div>

        {/* Links List */}
        {links.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <LinkIcon className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
              <p className="text-text-secondary mb-4">Nessun link referral creato</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Crea il tuo primo link
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <Card key={link.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        link.isActive 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {link.isActive ? 'Attivo' : 'Inattivo'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-light text-primary">
                        {getTypeLabel(link.type)}
                      </span>
                    </div>
                    
                    {link.name && (
                      <h3 className="font-semibold text-text-primary mb-2">{link.name}</h3>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      <code className="text-sm bg-background px-3 py-1 rounded border border-border flex-1 max-w-md truncate">
                        {link.url}
                      </code>
                      <button
                        onClick={() => handleCopy(link.url)}
                        className="p-2 hover:bg-background rounded-lg transition-colors"
                        title="Copia link"
                      >
                        <Copy size={18} className="text-text-secondary" />
                      </button>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Eye size={16} />
                        <span>{link.clicks} click</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} />
                        <span>{link.conversions} conversioni</span>
                      </div>
                      <div>
                        <span>Tasso: {link.conversionRate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(link.id, link.isActive)}
                      className={`p-2 rounded-lg transition-colors ${
                        link.isActive 
                          ? 'hover:bg-yellow-50 text-yellow-600' 
                          : 'hover:bg-green-50 text-green-600'
                      }`}
                      title={link.isActive ? 'Disattiva' : 'Attiva'}
                    >
                      {link.isActive ? 'Pausa' : 'Play'}
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      title="Elimina"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-text-primary mb-4">Crea Nuovo Link</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Tipo Link
                  </label>
                  <select
                    value={newLink.type}
                    onChange={(e) => setNewLink({ ...newLink, type: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="registration">Registrazione</option>
                    <option value="product">Prodotto</option>
                    <option value="funnel">Funnel</option>
                    <option value="event">Evento</option>
                    <option value="generic">Generico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Nome (opzionale)
                  </label>
                  <Input
                    value={newLink.name}
                    onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                    placeholder="Es: Link Registrazione Q1 2024"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewLink({ type: 'registration', name: '', defaultAction: 'register' })
                    }}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                  <Button type="submit" className="flex-1">
                    Crea Link
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

