'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react'
import { apiUrl } from '@/lib/api'

interface WalletData {
  balance: number
  availableBalance: number
  pendingWithdrawals: number
  totalTransactions: number
}

interface Transaction {
  id: number
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  status: string
  description: string
  createdAt: string
}

interface Withdrawal {
  id: number
  amount: number
  fee: number
  netAmount: number
  method: string
  status: string
  createdAt: string
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer')
  const [iban, setIban] = useState('')

  useEffect(() => {
    fetchWalletData()
    fetchTransactions()
    fetchWithdrawals()
  }, [])

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(apiUrl('/api/wallet/balance'), {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setWalletData(data)
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(apiUrl('/api/wallet/transactions?limit=10'), {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(apiUrl('/api/wallet/withdrawals?limit=5'), {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setWithdrawals(data.withdrawals)
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!walletData || !withdrawAmount) return

    const amount = parseFloat(withdrawAmount)
    if (amount <= 0) {
      alert('Importo non valido')
      return
    }

    if (withdrawMethod === 'bank_transfer' && !iban) {
      alert('Inserisci IBAN')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(apiUrl('/api/wallet/withdraw'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          withdrawalMethod: withdrawMethod,
          bankDetails: withdrawMethod === 'bank_transfer' ? { iban } : {}
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('✅ Richiesta di prelievo inviata con successo!')
        setShowWithdrawModal(false)
        setWithdrawAmount('')
        setIban('')
        fetchWalletData()
        fetchTransactions()
        fetchWithdrawals()
      } else {
        alert(data.message || 'Errore nella richiesta di prelievo')
      }
    } catch (error) {
      console.error('Error creating withdrawal:', error)
      alert('Errore nella richiesta di prelievo')
    }
  }

  const getTransactionIcon = (type: string) => {
    if (type === 'commission') return <TrendingUp className="text-green-500" size={20} />
    if (type === 'withdrawal') return <ArrowUpRight className="text-red-500" size={20} />
    return <ArrowDownLeft className="text-blue-500" size={20} />
  }

  const getStatusBadge = (status: string) => {
    if (status === 'completed') return <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={14} />Completato</span>
    if (status === 'pending' || status === 'processing') return <span className="flex items-center gap-1 text-yellow-600 text-xs"><Clock size={14} />In elaborazione</span>
    if (status === 'failed' || status === 'rejected') return <span className="flex items-center gap-1 text-red-600 text-xs"><XCircle size={14} />Fallito</span>
    return <span className="text-xs text-text-secondary">{status}</span>
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
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
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Wallet className="text-primary" size={28} />
            Il Mio Wallet
          </h1>
          <p className="text-text-secondary mt-1">Gestisci il tuo saldo e le tue commissioni</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Saldo Totale</span>
                <Wallet className="text-primary" size={20} />
              </div>
              <p className="text-3xl font-bold text-text-primary">
                €{walletData?.balance.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-text-secondary mt-1">Inclusi prelievi in elaborazione</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Disponibile</span>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-green-600">
                €{walletData?.availableBalance.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-text-secondary mt-1">Saldo prelevabile</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">In Elaborazione</span>
                <Clock className="text-yellow-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-yellow-600">
                €{walletData?.pendingWithdrawals.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-text-secondary mt-1">Prelievi in corso</p>
            </div>
          </Card>
        </div>

        {/* Withdraw Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!walletData || walletData.availableBalance <= 0}
          >
            Richiedi Prelievo
          </Button>
        </div>

        {/* Recent Transactions */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Ultime Transazioni</h2>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-text-secondary text-center py-8">Nessuna transazione</p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-background transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{tx.description}</p>
                      <p className="text-xs text-text-secondary">
                        {new Date(tx.createdAt).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}€{tx.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-text-secondary">Saldo: €{tx.balanceAfter.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 text-center">
            <button className="text-sm text-primary hover:underline">Vedi tutte le transazioni</button>
          </div>
        </Card>

        {/* Recent Withdrawals */}
        {withdrawals.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Prelievi Recenti</h2>
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-text-primary">
                      €{w.amount.toFixed(2)} ({w.method === 'bank_transfer' ? 'Bonifico' : 'Carta'})
                    </p>
                    <p className="text-xs text-text-secondary">
                      Netto: €{w.netAmount.toFixed(2)} (Fee: €{w.fee.toFixed(2)})
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(w.status)}
                    <p className="text-xs text-text-secondary mt-1">
                      {new Date(w.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-text-primary mb-4">Richiedi Prelievo</h2>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Importo (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max={walletData?.availableBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Disponibile: €{walletData?.availableBalance.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Metodo di Prelievo
                  </label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="bank_transfer">Bonifico Bancario (Fee: €2.00)</option>
                    <option value="card">Carta (Fee: €5.00)</option>
                  </select>
                </div>

                {withdrawMethod === 'bank_transfer' && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      IBAN
                    </label>
                    <input
                      type="text"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      placeholder="IT60 X054 2811 1010 0000 0123 456"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                )}

                {withdrawAmount && (
                  <div className="p-3 bg-background rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Importo:</span>
                      <span>€{parseFloat(withdrawAmount || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fee:</span>
                      <span>€{(withdrawMethod === 'bank_transfer' ? 2.0 : 5.0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-border pt-2 mt-2">
                      <span>Riceverai:</span>
                      <span>€{(parseFloat(withdrawAmount || '0') - (withdrawMethod === 'bank_transfer' ? 2.0 : 5.0)).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowWithdrawModal(false)
                      setWithdrawAmount('')
                      setIban('')
                    }}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                  <Button type="submit" className="flex-1">
                    Conferma Prelievo
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

