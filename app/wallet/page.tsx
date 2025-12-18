'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  Download,
  Filter,
  Eye,
  EyeOff,
  Shield,
  CreditCard,
  Building
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { AreaChart } from '@/components/charts/AreaChart'
import { apiGet, apiPost } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface WalletData {
  available: number
  pending: number
  earned: number
  kycApproved: boolean
  transactions: Transaction[]
  withdrawals: Withdrawal[]
}

interface Transaction {
  id: string
  type: 'commission' | 'bonus' | 'withdrawal' | 'refund'
  amount: number
  description: string
  status: 'completed' | 'pending' | 'failed'
  createdAt: string
}

interface Withdrawal {
  id: string
  amount: number
  method: string
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  createdAt: string
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'crypto'>('bank')
  const [activeTab, setActiveTab] = useState<'all' | 'commissions' | 'withdrawals'>('all')

  useEffect(() => {
    loadWallet()
  }, [])

  const loadWallet = async () => {
    try {
      const response = await apiGet('/api/wallet')
      if (response.success) {
        setData(response.data)
      }
    } catch (error) {
      console.error('Error loading wallet:', error)
      // Mock data
      setData({
        available: 2450.00,
        pending: 850.00,
        earned: 15680.00,
        kycApproved: true,
        transactions: [
          { id: '1', type: 'commission', amount: 250, description: 'Commissione Binaria Settimana 50', status: 'completed', createdAt: '2024-12-15T10:30:00Z' },
          { id: '2', type: 'commission', amount: 180, description: 'Commissione Diretta - Mario Rossi', status: 'completed', createdAt: '2024-12-14T15:45:00Z' },
          { id: '3', type: 'bonus', amount: 100, description: 'Bonus Rank Bronze', status: 'completed', createdAt: '2024-12-13T09:00:00Z' },
          { id: '4', type: 'withdrawal', amount: -500, description: 'Prelievo Bonifico', status: 'completed', createdAt: '2024-12-10T14:20:00Z' },
          { id: '5', type: 'commission', amount: 320, description: 'Commissione Multilevel Livello 3', status: 'pending', createdAt: '2024-12-09T11:15:00Z' },
        ],
        withdrawals: [
          { id: '1', amount: 500, method: 'bank', status: 'completed', createdAt: '2024-12-10T14:20:00Z' },
          { id: '2', amount: 300, method: 'crypto', status: 'pending', createdAt: '2024-12-08T09:30:00Z' },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Inserisci un importo valido')
      return
    }
    if (amount > (data?.available || 0)) {
      toast.error('Saldo insufficiente')
      return
    }
    if (amount < 50) {
      toast.error('Importo minimo: €50')
      return
    }

    try {
      const response = await apiPost('/api/wallet/withdraw', {
        amount,
        method: withdrawMethod,
      })
      if (response.success) {
        toast.success('Richiesta di prelievo inviata!')
        setShowWithdrawModal(false)
        setWithdrawAmount('')
        loadWallet()
      } else {
        toast.error(response.message || 'Errore durante il prelievo')
      }
    } catch (error) {
      toast.error('Errore durante il prelievo')
    }
  }

  // Mock chart data
  const earningsHistory = [
    { name: 'Sett 1', earnings: 450 },
    { name: 'Sett 2', earnings: 680 },
    { name: 'Sett 3', earnings: 520 },
    { name: 'Sett 4', earnings: 890 },
    { name: 'Sett 5', earnings: 750 },
    { name: 'Sett 6', earnings: 980 },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-slate-200 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) return null

  const filteredTransactions = data.transactions.filter(t => {
    if (activeTab === 'all') return true
    if (activeTab === 'commissions') return t.type === 'commission' || t.type === 'bonus'
    if (activeTab === 'withdrawals') return t.type === 'withdrawal'
    return true
  })

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 bg-brand-100 rounded-xl">
            <Wallet className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Wallet</h1>
            <p className="text-slate-500">Gestisci i tuoi guadagni</p>
          </div>
        </motion.div>

        {/* Main Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-brand-500 via-brand-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                  <Wallet className="w-6 h-6" />
                </div>
                <span className="font-medium opacity-90">Saldo Disponibile</span>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="text-5xl font-bold mb-6">
              {showBalance ? `€${data.available.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '••••••'}
            </div>

            <div className="flex flex-wrap gap-6 mb-6">
              <div>
                <p className="text-sm opacity-70">In Attesa</p>
                <p className="text-xl font-semibold">
                  {showBalance ? `€${data.pending.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '••••'}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-70">Totale Guadagnato</p>
                <p className="text-xl font-semibold">
                  {showBalance ? `€${data.earned.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '••••'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {data.kycApproved ? (
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-brand-600 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  Preleva
                </button>
              ) : (
                <Link
                  href="/kyc"
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  Completa KYC per prelevare
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-accent-100 rounded-xl">
                <ArrowDownLeft className="w-5 h-5 text-accent-600" />
              </div>
              <span className="text-sm text-slate-500">Entrate Settimana</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              €{(data.transactions
                .filter(t => t.type !== 'withdrawal' && t.status === 'completed')
                .slice(0, 5)
                .reduce((sum, t) => sum + t.amount, 0)
              ).toLocaleString('it-IT')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-slate-500">In Elaborazione</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {data.withdrawals.filter(w => w.status === 'pending').length} prelievi
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-brand-100 rounded-xl">
                <Check className="w-5 h-5 text-brand-600" />
              </div>
              <span className="text-sm text-slate-500">Prelievi Completati</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {data.withdrawals.filter(w => w.status === 'completed').length}
            </p>
          </motion.div>
        </div>

        {/* Earnings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Andamento Guadagni</h3>
              <p className="text-sm text-slate-500">Ultime 6 settimane</p>
            </div>
          </div>
          <AreaChart
            data={earningsHistory}
            dataKeys={[{ key: 'earnings', color: '#6366f1', name: 'Guadagni' }]}
            height={250}
            showLegend={false}
          />
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Transazioni</h3>
              <div className="flex gap-2">
                {(['all', 'commissions', 'withdrawals'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'all' ? 'Tutte' : tab === 'commissions' ? 'Commissioni' : 'Prelievi'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-500">Nessuna transazione</p>
              </div>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                >
                  <TransactionIcon type={transaction.type} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(transaction.createdAt).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.amount > 0 ? 'text-accent-600' : 'text-slate-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}€{Math.abs(transaction.amount).toLocaleString('it-IT')}
                    </p>
                    <TransactionStatus status={transaction.status} />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Withdraw Modal */}
        <AnimatePresence>
          {showWithdrawModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowWithdrawModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-slate-900 mb-6">Richiedi Prelievo</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Importo (min €50)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">€</span>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Disponibile: €{data.available.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Metodo di pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setWithdrawMethod('bank')}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                          withdrawMethod === 'bank'
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Building className={`w-5 h-5 ${withdrawMethod === 'bank' ? 'text-brand-600' : 'text-slate-400'}`} />
                        <span className={`font-medium ${withdrawMethod === 'bank' ? 'text-brand-600' : 'text-slate-600'}`}>
                          Bonifico
                        </span>
                      </button>
                      <button
                        onClick={() => setWithdrawMethod('crypto')}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                          withdrawMethod === 'crypto'
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <CreditCard className={`w-5 h-5 ${withdrawMethod === 'crypto' ? 'text-brand-600' : 'text-slate-400'}`} />
                        <span className={`font-medium ${withdrawMethod === 'crypto' ? 'text-brand-600' : 'text-slate-600'}`}>
                          Crypto
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleWithdraw}
                    className="flex-1 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
                  >
                    Conferma
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}

function TransactionIcon({ type }: { type: string }) {
  const config: Record<string, { icon: any; bg: string; text: string }> = {
    commission: { icon: ArrowDownLeft, bg: 'bg-accent-100', text: 'text-accent-600' },
    bonus: { icon: Check, bg: 'bg-amber-100', text: 'text-amber-600' },
    withdrawal: { icon: ArrowUpRight, bg: 'bg-purple-100', text: 'text-purple-600' },
    refund: { icon: ArrowDownLeft, bg: 'bg-blue-100', text: 'text-blue-600' },
  }

  const { icon: Icon, bg, text } = config[type] || config.commission

  return (
    <div className={`p-2.5 rounded-xl ${bg}`}>
      <Icon className={`w-5 h-5 ${text}`} />
    </div>
  )
}

function TransactionStatus({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    completed: { label: 'Completato', class: 'text-accent-600 bg-accent-50' },
    pending: { label: 'In attesa', class: 'text-amber-600 bg-amber-50' },
    failed: { label: 'Fallito', class: 'text-red-600 bg-red-50' },
  }

  const { label, class: className } = config[status] || config.pending

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${className}`}>
      {label}
    </span>
  )
}
