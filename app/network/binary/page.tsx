'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  TrendingUp, 
  Award,
  Info,
  HelpCircle,
  ChevronDown,
  Layers
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { BinaryTreeVisualizer } from '@/components/network/BinaryTreeVisualizer'

export default function BinaryNetworkPage() {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-xl">
                <Layers className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Albero Binario
                </h1>
                <p className="text-slate-500">
                  Gestisci la tua struttura a 2 gambe
                </p>
              </div>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Come funziona</span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showInfo ? 'rotate-180' : ''}`} />
          </motion.button>
        </div>

        {/* Info Panel */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl p-6 border border-brand-100"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-600" />
              Sistema Binario 3Blex
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <InfoItem
                  title="Struttura a 2 Gambe"
                  description="Ogni affiliato può avere al massimo 2 diretti: uno a sinistra e uno a destra."
                />
                <InfoItem
                  title="Spillover Automatico"
                  description="Se le tue posizioni sono piene, i nuovi affiliati vengono posizionati nella prima posizione libera (BFS)."
                />
                <InfoItem
                  title="Bilanciamento"
                  description="Lo spillover automatico bilancia le gambe privilegiando quella più debole."
                />
              </div>
              <div className="space-y-3">
                <InfoItem
                  title="Volume Gambe"
                  description="Il volume di ogni gamba è la somma del PV di tutti gli affiliati sotto quella posizione."
                />
                <InfoItem
                  title="Commissione Binaria"
                  description="Guadagni il 10% del volume della gamba più debole, calcolato settimanalmente."
                />
                <InfoItem
                  title="Carryover"
                  description="Il volume in eccesso della gamba forte viene riportato al ciclo successivo (max 3 cicli)."
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Binary Tree Visualizer */}
        <BinaryTreeVisualizer maxDepth={5} />

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Legenda Rank</h3>
          <div className="flex flex-wrap gap-3">
            <RankBadge rank="UNRANKED" color="bg-slate-100 text-slate-600" />
            <RankBadge rank="BRONZE" color="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800" />
            <RankBadge rank="SILVER" color="bg-gradient-to-r from-slate-100 to-gray-200 text-slate-700" />
            <RankBadge rank="GOLD" color="bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800" />
            <RankBadge rank="PLATINUM" color="bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-800" />
            <RankBadge rank="DIAMOND" color="bg-gradient-to-r from-violet-100 via-purple-100 to-fuchsia-100 text-purple-800" />
          </div>
        </motion.div>

        {/* Tips */}
        <div className="grid md:grid-cols-3 gap-4">
          <TipCard
            icon={Users}
            title="Equilibra le Gambe"
            description="Posiziona strategicamente per massimizzare i volumi su entrambe le gambe."
            color="blue"
          />
          <TipCard
            icon={TrendingUp}
            title="Attiva i Diretti"
            description="I tuoi diretti sponsorizzati generano commissioni dirette del 20%."
            color="green"
          />
          <TipCard
            icon={Award}
            title="Aumenta il Rank"
            description="Rank più alti sbloccano bonus e percentuali migliori."
            color="purple"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

function InfoItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  )
}

function RankBadge({ rank, color }: { rank: string; color: string }) {
  return (
    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${color}`}>
      {rank}
    </span>
  )
}

function TipCard({ 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  icon: any
  title: string
  description: string
  color: 'blue' | 'green' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-accent-50 text-accent-600 border-accent-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <Icon className="w-6 h-6 mb-3" />
      <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  )
}
