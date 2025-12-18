'use client'

import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'

interface BarData {
  name: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarData[]
  height?: number
  color?: string
  showGrid?: boolean
  horizontal?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
      <p className="font-medium">{label}</p>
      <p className="text-lg font-bold mt-0.5">{payload[0].value.toLocaleString('it-IT')}</p>
    </div>
  )
}

export function BarChart({
  data,
  height = 250,
  color = '#6366f1',
  showGrid = true,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        )}
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="url(#barGradient)">
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color || color} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
