'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  UserPlus, 
  Link2, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Users,
  TrendingUp,
  Crown,
  Zap
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import toast from 'react-hot-toast'

interface TreeNode {
  id: string
  userId: string | null
  firstName?: string
  lastName?: string
  email?: string
  position: 'root' | 'left' | 'right'
  rank?: string
  leftVolume?: number
  rightVolume?: number
  isActive?: boolean
  leftChild?: TreeNode | null
  rightChild?: TreeNode | null
  depth: number
}

interface BinaryTreeVisualizerProps {
  userId?: string
  maxDepth?: number
}

const rankColors: Record<string, string> = {
  UNRANKED: 'bg-slate-100 text-slate-600 border-slate-200',
  BRONZE: 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-800 border-orange-300',
  SILVER: 'bg-gradient-to-br from-slate-100 to-gray-200 text-slate-700 border-slate-400',
  GOLD: 'bg-gradient-to-br from-amber-100 to-yellow-200 text-amber-800 border-amber-400',
  PLATINUM: 'bg-gradient-to-br from-cyan-100 to-teal-100 text-cyan-800 border-cyan-400',
  DIAMOND: 'bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 text-purple-800 border-purple-400',
}

const rankIcons: Record<string, any> = {
  UNRANKED: User,
  BRONZE: Zap,
  SILVER: TrendingUp,
  GOLD: Crown,
  PLATINUM: Crown,
  DIAMOND: Crown,
}

export function BinaryTreeVisualizer({ userId, maxDepth = 4 }: BinaryTreeVisualizerProps) {
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [showRefModal, setShowRefModal] = useState(false)
  const [refPosition, setRefPosition] = useState<'left' | 'right' | null>(null)
  const [refLink, setRefLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [visibleDepth, setVisibleDepth] = useState(3)
  const [stats, setStats] = useState({
    leftVolume: 0,
    rightVolume: 0,
    leftMembers: 0,
    rightMembers: 0,
    weakerLeg: 'left' as 'left' | 'right',
  })

  useEffect(() => {
    loadTree()
  }, [userId])

  const loadTree = async () => {
    try {
      setLoading(true)
      const response = await apiGet(`/api/network/binary-tree${userId ? `?userId=${userId}` : ''}`)
      if (response.success) {
        setTree(response.tree)
        setStats(response.stats || stats)
      }
    } catch (error) {
      console.error('Error loading tree:', error)
      // Mock data per demo
      setTree(createMockTree())
      setStats({
        leftVolume: 15000,
        rightVolume: 12500,
        leftMembers: 45,
        rightMembers: 38,
        weakerLeg: 'right',
      })
    } finally {
      setLoading(false)
    }
  }

  const createMockTree = (): TreeNode => ({
    id: '1',
    userId: 'user-1',
    firstName: 'Tu',
    lastName: '',
    position: 'root',
    rank: 'GOLD',
    isActive: true,
    leftVolume: 15000,
    rightVolume: 12500,
    depth: 0,
    leftChild: {
      id: '2',
      userId: 'user-2',
      firstName: 'Mario',
      lastName: 'Rossi',
      position: 'left',
      rank: 'SILVER',
      isActive: true,
      depth: 1,
      leftChild: {
        id: '4',
        userId: 'user-4',
        firstName: 'Luca',
        lastName: 'Verdi',
        position: 'left',
        rank: 'BRONZE',
        isActive: true,
        depth: 2,
        leftChild: null,
        rightChild: null,
      },
      rightChild: {
        id: '5',
        userId: 'user-5',
        firstName: 'Anna',
        lastName: 'Bianchi',
        position: 'right',
        rank: 'BRONZE',
        isActive: true,
        depth: 2,
        leftChild: null,
        rightChild: null,
      },
    },
    rightChild: {
      id: '3',
      userId: 'user-3',
      firstName: 'Giulia',
      lastName: 'Ferrari',
      position: 'right',
      rank: 'SILVER',
      isActive: true,
      depth: 1,
      leftChild: {
        id: '6',
        userId: 'user-6',
        firstName: 'Paolo',
        lastName: 'Conti',
        position: 'left',
        rank: 'UNRANKED',
        isActive: true,
        depth: 2,
        leftChild: null,
        rightChild: null,
      },
      rightChild: null,
    },
  })

  const generateRefLink = async (position: 'left' | 'right', nodeId?: string) => {
    try {
      const response = await apiPost('/api/referral-links/create', {
        position,
        parentNodeId: nodeId,
      })
      if (response.success) {
        setRefLink(response.link)
      } else {
        // Fallback per demo
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        setRefLink(`${baseUrl}/ref/pos-${position}-${Date.now().toString(36)}`)
      }
    } catch (error) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setRefLink(`${baseUrl}/ref/pos-${position}-${Date.now().toString(36)}`)
    }
    setRefPosition(position)
    setShowRefModal(true)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(refLink)
      setCopied(true)
      toast.success('Link copiato!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Errore nella copia')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsBox
          label="Gamba Sinistra"
          value={stats.leftVolume}
          members={stats.leftMembers}
          isWeak={stats.weakerLeg === 'left'}
          color="blue"
        />
        <StatsBox
          label="Gamba Destra"
          value={stats.rightVolume}
          members={stats.rightMembers}
          isWeak={stats.weakerLeg === 'right'}
          color="purple"
        />
        <div className="col-span-2 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-80">Commissione Binaria Stimata</p>
          <p className="text-2xl font-bold">
            €{(Math.min(stats.leftVolume, stats.rightVolume) * 0.1).toLocaleString('it-IT')}
          </p>
          <p className="text-xs opacity-70 mt-1">10% sulla gamba debole</p>
        </div>
      </div>

      {/* Depth Control */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-3">
        <span className="text-sm font-medium text-slate-600">Livelli visibili: {visibleDepth}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setVisibleDepth(Math.max(1, visibleDepth - 1))}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            disabled={visibleDepth <= 1}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setVisibleDepth(Math.min(maxDepth, visibleDepth + 1))}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            disabled={visibleDepth >= maxDepth}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 overflow-x-auto">
        <div className="min-w-[600px] flex flex-col items-center">
          {tree && <TreeNodeComponent 
            node={tree} 
            onGenerateLink={generateRefLink}
            onSelectNode={setSelectedNode}
            maxVisibleDepth={visibleDepth}
          />}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => generateRefLink('left')}
          className="flex items-center justify-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-dashed border-blue-300 transition-colors group"
        >
          <div className="p-2 bg-blue-500 rounded-lg text-white group-hover:scale-110 transition-transform">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-blue-900">Inserisci a Sinistra</p>
            <p className="text-xs text-blue-600">Genera link referral</p>
          </div>
        </button>
        <button
          onClick={() => generateRefLink('right')}
          className="flex items-center justify-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border-2 border-dashed border-purple-300 transition-colors group"
        >
          <div className="p-2 bg-purple-500 rounded-lg text-white group-hover:scale-110 transition-transform">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-purple-900">Inserisci a Destra</p>
            <p className="text-xs text-purple-600">Genera link referral</p>
          </div>
        </button>
      </div>

      {/* Ref Link Modal */}
      <AnimatePresence>
        {showRefModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRefModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${
                  refPosition === 'left' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <Link2 className={`w-6 h-6 ${
                    refPosition === 'left' ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Link Referral Generato</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Posizione: <span className="font-semibold capitalize">{refPosition}</span>
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-600 break-all font-mono">{refLink}</p>
              </div>

              <button
                onClick={copyToClipboard}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                  copied
                    ? 'bg-accent-500 text-white'
                    : 'bg-brand-500 hover:bg-brand-600 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copiato!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copia Link
                  </>
                )}
              </button>

              <button
                onClick={() => setShowRefModal(false)}
                className="w-full py-3 mt-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Chiudi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Stats Box Component
function StatsBox({ 
  label, 
  value, 
  members, 
  isWeak, 
  color 
}: { 
  label: string
  value: number
  members: number
  isWeak: boolean
  color: 'blue' | 'purple'
}) {
  const bgColor = color === 'blue' ? 'bg-blue-50' : 'bg-purple-50'
  const textColor = color === 'blue' ? 'text-blue-600' : 'text-purple-600'
  const borderColor = isWeak ? 'border-amber-400' : 'border-transparent'

  return (
    <div className={`${bgColor} rounded-xl p-4 border-2 ${borderColor} relative`}>
      {isWeak && (
        <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
          Debole
        </span>
      )}
      <p className={`text-sm ${textColor}`}>{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">
        €{value.toLocaleString('it-IT')}
      </p>
      <div className="flex items-center gap-1 mt-2 text-slate-500 text-sm">
        <Users className="w-4 h-4" />
        <span>{members} membri</span>
      </div>
    </div>
  )
}

// Tree Node Component
function TreeNodeComponent({
  node,
  onGenerateLink,
  onSelectNode,
  maxVisibleDepth,
  currentDepth = 0,
}: {
  node: TreeNode
  onGenerateLink: (position: 'left' | 'right', nodeId?: string) => void
  onSelectNode: (node: TreeNode) => void
  maxVisibleDepth: number
  currentDepth?: number
}) {
  if (currentDepth > maxVisibleDepth) return null

  const RankIcon = node.rank ? rankIcons[node.rank] || User : User
  const rankClass = node.rank ? rankColors[node.rank] : rankColors.UNRANKED
  const isRoot = node.position === 'root'

  // Calculate spacing based on depth
  const horizontalSpacing = Math.max(60, 200 - currentDepth * 40)

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: currentDepth * 0.1 }}
        className={`relative cursor-pointer ${rankClass} border-2 rounded-2xl p-4 min-w-[120px] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1`}
        onClick={() => onSelectNode(node)}
      >
        {isRoot && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
            TU
          </div>
        )}
        
        <div className="flex flex-col items-center">
          <div className={`p-2 rounded-xl mb-2 ${isRoot ? 'bg-brand-500 text-white' : 'bg-white/50'}`}>
            <RankIcon className="w-6 h-6" />
          </div>
          <p className="font-semibold text-sm text-center truncate max-w-[100px]">
            {node.firstName || 'Utente'}
          </p>
          <p className="text-xs opacity-75 capitalize">{node.rank?.toLowerCase() || 'Unranked'}</p>
        </div>
      </motion.div>

      {/* Connectors and Children */}
      {currentDepth < maxVisibleDepth && (
        <div className="flex flex-col items-center mt-4">
          {/* Vertical connector from parent */}
          <div className="w-0.5 h-6 bg-gradient-to-b from-slate-300 to-slate-200" />
          
          {/* Horizontal connector */}
          <div className="relative flex items-start" style={{ gap: `${horizontalSpacing}px` }}>
            {/* Left connector */}
            <div className="flex flex-col items-center">
              <div 
                className="h-0.5 bg-gradient-to-r from-slate-200 to-blue-300"
                style={{ width: `${horizontalSpacing / 2}px`, marginLeft: `${horizontalSpacing / 2}px` }}
              />
              <div className="w-0.5 h-6 bg-blue-300" />
              {node.leftChild ? (
                <TreeNodeComponent
                  node={node.leftChild}
                  onGenerateLink={onGenerateLink}
                  onSelectNode={onSelectNode}
                  maxVisibleDepth={maxVisibleDepth}
                  currentDepth={currentDepth + 1}
                />
              ) : (
                <EmptySlot position="left" onClick={() => onGenerateLink('left', node.id)} />
              )}
            </div>

            {/* Right connector */}
            <div className="flex flex-col items-center">
              <div 
                className="h-0.5 bg-gradient-to-l from-slate-200 to-purple-300"
                style={{ width: `${horizontalSpacing / 2}px`, marginRight: `${horizontalSpacing / 2}px` }}
              />
              <div className="w-0.5 h-6 bg-purple-300" />
              {node.rightChild ? (
                <TreeNodeComponent
                  node={node.rightChild}
                  onGenerateLink={onGenerateLink}
                  onSelectNode={onSelectNode}
                  maxVisibleDepth={maxVisibleDepth}
                  currentDepth={currentDepth + 1}
                />
              ) : (
                <EmptySlot position="right" onClick={() => onGenerateLink('right', node.id)} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Empty Slot Component
function EmptySlot({ position, onClick }: { position: 'left' | 'right'; onClick: () => void }) {
  const isLeft = position === 'left'
  
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={`
        min-w-[100px] p-4 rounded-2xl border-2 border-dashed transition-all
        ${isLeft 
          ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400' 
          : 'border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400'
        }
      `}
    >
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-xl mb-2 ${isLeft ? 'bg-blue-200' : 'bg-purple-200'}`}>
          <UserPlus className={`w-5 h-5 ${isLeft ? 'text-blue-600' : 'text-purple-600'}`} />
        </div>
        <p className={`text-xs font-medium ${isLeft ? 'text-blue-600' : 'text-purple-600'}`}>
          Posizione Libera
        </p>
        <p className={`text-xs ${isLeft ? 'text-blue-400' : 'text-purple-400'}`}>
          Clicca per link
        </p>
      </div>
    </motion.button>
  )
}
