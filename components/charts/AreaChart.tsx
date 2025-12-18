'use client'

import { 
  AreaChart as RechartsAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'

interface DataPoint {
  name: string
  [key: string]: string | number
}

interface AreaChartProps {
  data: DataPoint[]
  dataKeys: {
    key: string
    color: string
    name: string
  }[]
  height?: number
  showGrid?: boolean
  showLegend?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-semibold">€{entry.value.toLocaleString('it-IT')}</span>
        </p>
      ))}
    </div>
  )
}

export function AreaChart({
  data,
  dataKeys,
  height = 300,
  showGrid = true,
  showLegend = true,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {dataKeys.map((dk) => (
            <linearGradient key={dk.key} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={dk.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
            </linearGradient>
          ))}
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
          tickFormatter={(value) => `€${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-slate-600 text-sm">{value}</span>}
          />
        )}
        {dataKeys.map((dk) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.name}
            stroke={dk.color}
            strokeWidth={2}
            fill={`url(#gradient-${dk.key})`}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
