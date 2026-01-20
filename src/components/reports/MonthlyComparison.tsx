import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { formatCurrency } from '@/lib/formatters'

interface MonthData {
  month: string
  income: number
  expense: number
  balance: number
}

interface MonthlyComparisonProps {
  data: MonthData[]
  loading?: boolean
}

export function MonthlyComparison({ data, loading }: MonthlyComparisonProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
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
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Receitas" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" name="Despesas" radius={[4, 4, 0, 0]} />
            <Bar dataKey="balance" fill="#3b82f6" name="Saldo" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
