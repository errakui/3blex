'use client'

import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Users, UserCheck, X } from 'lucide-react'

interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  subscription_status: string
  subscription_plan: string | null
  referral_code: string
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token')
      
      try {
        const response = await fetch(
          apiUrl('/api/admin/users'),
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
        setUsers(data.users || [])
      } catch (err) {
        console.error('Error fetching users:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

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
            Gestione Utenti
          </h1>
          <p className="text-text-secondary">
            Visualizza e gestisci tutti gli utenti del sistema
          </p>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Ruolo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Abbonamento
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Codice Referral
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                    Registrato
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-background">
                    <td className="py-4 px-4 text-text-primary font-medium">
                      {user.name}
                    </td>
                    <td className="py-4 px-4 text-text-secondary text-sm">
                      {user.email}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-600'
                            : user.role === 'network_member'
                            ? 'bg-primary-light text-primary-dark'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.role === 'admin'
                          ? 'Admin'
                          : user.role === 'network_member'
                          ? 'Network Member'
                          : 'Affiliate Basic'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {user.subscription_status === 'active' ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                          {user.subscription_plan || 'Attivo'}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          Inattivo
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-text-secondary text-sm font-mono">
                      {user.referral_code}
                    </td>
                    <td className="py-4 px-4 text-text-secondary text-sm">
                      {new Date(user.created_at).toLocaleDateString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12 text-text-secondary">
              <Users className="mx-auto mb-4 text-text-secondary opacity-50" size={48} />
              <p>Nessun utente trovato</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

