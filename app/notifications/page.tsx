'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Bell, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { apiUrl } from '@/lib/api'

interface Notification {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token')
      
      try {
        const response = await fetch(
          apiUrl('/api/notifications'),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (err) {
        console.error('Error fetching notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />
      case 'error':
        return <XCircle className="text-red-500" size={20} />
      default:
        return <Info className="text-primary" size={20} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-background border-border'
    }
  }

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem('token')
    
    try {
      await fetch(
        apiUrl('/api/notifications/${id}/read'),
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    return true
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
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Notifiche
          </h1>
          <p className="text-text-secondary">
            Gestisci le tue notifiche e aggiornamenti
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex items-center gap-2 flex-wrap">
            <Chip
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              Tutte
            </Chip>
            <Chip
              active={filter === 'unread'}
              onClick={() => setFilter('unread')}
            >
              Non lette
            </Chip>
            <Chip
              active={filter === 'read'}
              onClick={() => setFilter('read')}
            >
              Lette
            </Chip>
          </div>
        </Card>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`${getTypeColor(notification.type)} ${
                  !notification.read ? 'border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-text-primary">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></span>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-secondary">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: it,
                        })}
                      </p>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-primary hover:text-primary-dark font-medium"
                        >
                          Segna come letta
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Bell className="mx-auto mb-4 text-text-secondary opacity-50" size={64} />
            <p className="text-text-secondary text-lg">
              Nessuna notifica trovata
            </p>
            <p className="text-text-secondary text-sm mt-2">
              Le tue notifiche appariranno qui
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

