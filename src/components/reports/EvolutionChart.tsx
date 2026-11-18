import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface EvolutionData {
  month: string
  netWorth: number
}

interface EvolutionChartProps {
  data: EvolutionData[]
  loading?: boolean
  selectedDate?: Date
  onPrev?: () => void
  onNext?: () => void
}

export function EvolutionChart({ data, loading, selectedDate, onPrev, onNext }: EvolutionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução Patrimonial</CardTitle>
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
        <CardTitle>Evolução Patrimonial</CardTitle>
        <div className="ml-auto flex items-center gap-2">
          {selectedDate && (
            <span className="text-sm text-muted-foreground mr-2">{selectedDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
          )}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNext} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="netWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Line
              type="monotone"
              dataKey="netWorth"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#netWorth)"
              name="Patrimônio Líquido"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
