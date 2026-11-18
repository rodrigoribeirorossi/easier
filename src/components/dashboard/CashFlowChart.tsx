import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/formatters'

interface CashFlowData {
  month: string
  income: number
  expense: number
}

interface CashFlowChartProps {
  data: CashFlowData[]
  loading?: boolean
}

export function CashFlowChart({ data, loading }: CashFlowChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  // compute Y axis max (ensure at least 14k) and ticks
  const rawMax = data && data.length ? Math.max(...data.map(d => Math.max(d.income || 0, d.expense || 0))) : 0
  const minMax = Math.max(14000, Math.ceil(rawMax / 1000) * 1000)
  const step = Math.max(1000, Math.ceil(minMax / 7 / 1000) * 1000)
  const ticks: number[] = []
  for (let v = 0; v <= minMax; v += step) ticks.push(v)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Caixa</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 560 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 140 }}>
            <defs>
              <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickMargin={8}
              domain={[0, minMax]}
              ticks={ticks}
              tickFormatter={(value: number | undefined) => {
                if (value === undefined || value === null) return ''
                const abs = Math.abs(value)
                if (abs >= 1000) {
                  const v = value / 1000
                  const formatted = v % 1 === 0 ? String(v) : v.toFixed(1)
                  return `${formatted}k`
                }
                return formatCurrency(value)
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#income)"
              name="Receitas"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#expense)"
              name="Despesas"
            />
          </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
