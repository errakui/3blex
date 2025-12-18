'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface DonutData {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutData[]
  height?: number
  showLegend?: boolean
  centerLabel?: {
    value: string
    subtitle: string
  }
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
      <p className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: data.payload.color }}
        />
        <span>{data.name}:</span>
        <span className="font-semibold">{data.value.toLocaleString('it-IT')}</span>
      </p>
    </div>
  )
}

export function DonutChart({
  data,
  height = 250,
  showLegend = true,
  centerLabel,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-slate-600 text-sm">{value}</span>}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: showLegend ? -18 : 0 }}>
          <span className="text-2xl font-bold text-slate-900">{centerLabel.value}</span>
          <span className="text-xs text-slate-500">{centerLabel.subtitle}</span>
        </div>
      )}
    </div>
  )
}
