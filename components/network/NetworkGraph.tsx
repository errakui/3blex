'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Users, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface Affiliate {
  id: number
  name: string
  email: string
  referralCode?: string
  level: number
  subscriptionStatus?: string
}

interface NetworkGraphProps {
  affiliates: Affiliate[]
  currentUserId: number
  currentUserRole: string
}

// User Icon SVG Component - minimalista e pulita
const UserIcon = ({ x, y, size, color }: { x: number; y: number; size: number; color: string }) => {
  const centerX = x + size / 2
  const centerY = y + size / 2
  const headRadius = size / 4
  const bodyOffset = size * 0.15
  
  return (
    <g>
      {/* Testa */}
      <circle 
        cx={centerX} 
        cy={centerY - bodyOffset} 
        r={headRadius} 
        fill="none" 
        stroke={color} 
        strokeWidth="1.5" 
      />
      {/* Corpo (arco) */}
      <path
        d={`M ${centerX - headRadius * 0.8} ${centerY + bodyOffset * 0.5} 
            Q ${centerX} ${centerY + bodyOffset} 
            ${centerX + headRadius * 0.8} ${centerY + bodyOffset * 0.5}`}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  )
}

export default function NetworkGraph({ affiliates, currentUserId, currentUserRole }: NetworkGraphProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  if (!affiliates || affiliates.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-primary" size={24} />
          <h3 className="text-lg font-semibold text-text-primary">
            Grafico di Crescita Rete
          </h3>
        </div>
        <div className="text-center py-12">
          <p className="text-text-secondary">Nessun affiliato da visualizzare</p>
        </div>
      </Card>
    )
  }

  // Dimensioni minimaliste
  const nodeSize = 56
  const levelHeight = 160
  const baseWidth = 1100
  const baseHeight = Math.max(550, Math.ceil(affiliates.length / 6) * levelHeight + 200)
  const rootX = baseWidth / 2
  const rootY = 80

  // Posizionamento affiliati
  const maxPerRow = 6
  const nodesPerRow = Math.min(maxPerRow, affiliates.length)
  const spacing = Math.min(160, (baseWidth - 120) / nodesPerRow)
  const startOffset = (baseWidth - (nodesPerRow * spacing)) / 2

  const getStatusColor = (status?: string) => {
    if (status === 'active') return { 
      bg: '#F0FDF4', 
      border: '#86EFAC', 
      icon: '#22C55E', 
      text: '#15803D',
      dot: '#22C55E'
    }
    if (status === 'pending') return { 
      bg: '#FEFCE8', 
      border: '#FDE047', 
      icon: '#EAB308', 
      text: '#A16207',
      dot: '#EAB308'
    }
    return { 
      bg: '#FAF5FF', 
      border: '#E9D5FF', 
      icon: '#A855F7', 
      text: '#7E22CE',
      dot: '#A855F7'
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.6))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.08 : 0.08
    setZoom(prev => Math.max(0.6, Math.min(2, prev + delta)))
  }

  return (
    <Card className="bg-white border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={20} />
          <h3 className="text-base font-semibold text-text-primary">
            Grafico di Crescita Rete
          </h3>
          <span className="text-xs text-text-secondary bg-background px-2.5 py-0.5 rounded-full">
            {affiliates.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-background transition-colors text-text-secondary hover:text-primary"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-text-secondary px-2 min-w-[45px] text-center font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-background transition-colors text-text-secondary hover:text-primary"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg hover:bg-background transition-colors text-text-secondary hover:text-primary ml-1"
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative bg-white rounded-lg border border-border overflow-hidden"
        style={{ minHeight: '520px', height: '520px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          width={baseWidth}
          height={baseHeight}
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          viewBox={`0 0 ${baseWidth} ${baseHeight}`}
        >
          {/* Linee connessione - sottili e pulite */}
          {affiliates.map((affiliate, index) => {
            const row = Math.floor(index / nodesPerRow)
            const col = index % nodesPerRow
            const x = startOffset + col * spacing + spacing / 2
            const y = rootY + levelHeight + row * levelHeight

            return (
              <line
                key={`line-${affiliate.id}`}
                x1={rootX}
                y1={rootY + nodeSize / 2}
                x2={x}
                y2={y - nodeSize / 2}
                stroke="#E5E4E5"
                strokeWidth="1"
                opacity="0.5"
              />
            )
          })}

          {/* Nodo root - pulito e minimalista */}
          <g>
            <circle
              cx={rootX}
              cy={rootY}
              r={nodeSize / 2}
              fill="#FBFAFC"
              stroke="#9F08F9"
              strokeWidth="2"
            />
            <UserIcon x={rootX - 18} y={rootY - 18} size={36} color="#9F08F9" />
            <text
              x={rootX}
              y={rootY + nodeSize / 2 + 18}
              textAnchor="middle"
              fill="#9F08F9"
              fontSize="12"
              fontWeight="600"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {currentUserRole === 'admin' ? 'Admin' : 'Tu'}
            </text>
          </g>

          {/* Nodi affiliati - minimalisti */}
          {affiliates.map((affiliate, index) => {
            const row = Math.floor(index / nodesPerRow)
            const col = index % nodesPerRow
            const x = startOffset + col * spacing + spacing / 2
            const y = rootY + levelHeight + row * levelHeight
            const colors = getStatusColor(affiliate.subscriptionStatus)

            return (
              <g key={`node-${affiliate.id}`}>
                {/* Cerchio nodo */}
                <circle
                  cx={x}
                  cy={y}
                  r={nodeSize / 2}
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth="2"
                />
                
                {/* Icona utente */}
                <UserIcon x={x - 16} y={y - 16} size={32} color={colors.icon} />
                
                {/* Punto stato */}
                <circle
                  cx={x + nodeSize / 2 - 10}
                  cy={y - nodeSize / 2 + 10}
                  r="5"
                  fill={colors.dot}
                />
                
                {/* Nome */}
                <text
                  x={x}
                  y={y + nodeSize / 2 + 16}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {affiliate.name.length > 14 ? affiliate.name.substring(0, 14) + '...' : affiliate.name}
                </text>
                
                {/* Email - minimalista */}
                <text
                  x={x}
                  y={y + nodeSize / 2 + 28}
                  textAnchor="middle"
                  fill="#7B7B7B"
                  fontSize="9"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {affiliate.email.split('@')[0].length > 11 
                    ? affiliate.email.split('@')[0].substring(0, 11) + '...' 
                    : affiliate.email.split('@')[0]}
                </text>
              </g>
            )
          })}

          {/* Legenda minimalista */}
          <g transform={`translate(40, ${baseHeight - 80})`}>
            <text x="0" y="0" fill="#000000" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">
              Legenda:
            </text>
            
            <g transform="translate(0, 20)">
              <circle cx="5" cy="0" r="4" fill="#22C55E" />
              <text x="14" y="3" fill="#7B7B7B" fontSize="10" fontFamily="system-ui, sans-serif">Attivo</text>
              
              <circle cx="70" cy="0" r="4" fill="#EAB308" />
              <text x="79" y="3" fill="#7B7B7B" fontSize="10" fontFamily="system-ui, sans-serif">In Attesa</text>
              
              <circle cx="145" cy="0" r="4" fill="#A855F7" />
              <text x="154" y="3" fill="#7B7B7B" fontSize="10" fontFamily="system-ui, sans-serif">Non Attivo</text>
            </g>
          </g>
        </svg>
        
        {/* Istruzioni minimaliste */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <p className="text-[10px] text-text-secondary bg-white/90 backdrop-blur px-2.5 py-1 rounded-full border border-border">
            Scroll per zoom • Trascina per spostare
          </p>
        </div>
      </div>
    </Card>
  )
}
