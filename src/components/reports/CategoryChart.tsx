import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/formatters'

interface CategoryData {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

interface CategoryChartProps {
  data: CategoryData[]
  loading?: boolean
  selectedDate?: Date
  onPrev?: () => void
  onNext?: () => void
  selectedStatus?: 'all' | 'pending' | 'paid' | 'overdue'
  onStatusChange?: (s: 'all' | 'pending' | 'paid' | 'overdue') => void
}

export function CategoryChart({ data, loading, selectedDate, onPrev, onNext, selectedStatus, onStatusChange }: CategoryChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')
  const total = (data || []).reduce((s, d) => s + (Number(d.value) || 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <div className="ml-auto flex items-center gap-2">
          {selectedDate && (
            <span className="text-sm text-muted-foreground mr-2">{selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          )}
          <div className="text-sm font-semibold text-foreground mr-3">{formatCurrency(total)}</div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNext} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="ml-2 flex items-center gap-2">
            <div className="flex items-center border border-border rounded overflow-hidden">
              <button
                aria-pressed={selectedStatus === 'all'}
                onClick={() => onStatusChange && onStatusChange('all')}
                className={`px-2 py-1 text-sm ${selectedStatus === 'all' ? 'bg-accent text-foreground' : 'bg-transparent'}`}
              >
                Todos
              </button>
              <button
                aria-pressed={selectedStatus === 'pending'}
                onClick={() => onStatusChange && onStatusChange('pending')}
                className={`px-2 py-1 text-sm ${selectedStatus === 'pending' ? 'bg-accent text-foreground' : 'bg-transparent'}`}
              >
                Pendentes
              </button>
              <button
                aria-pressed={selectedStatus === 'paid'}
                onClick={() => onStatusChange && onStatusChange('paid')}
                className={`px-2 py-1 text-sm ${selectedStatus === 'paid' ? 'bg-accent text-foreground' : 'bg-transparent'}`}
              >
                Pagos
              </button>
              <button
                aria-pressed={selectedStatus === 'overdue'}
                onClick={() => onStatusChange && onStatusChange('overdue')}
                className={`px-2 py-1 text-sm ${selectedStatus === 'overdue' ? 'bg-accent text-foreground' : 'bg-transparent'}`}
              >
                Atrasados
              </button>
            </div>

            <div className="flex items-center border border-border rounded overflow-hidden">
              <button
                aria-pressed={chartType === 'pie'}
                onClick={() => setChartType('pie')}
                className={`px-2 py-1 text-sm ${chartType === 'pie' ? 'bg-accent text-foreground' : 'bg-transparent'}`}
              >
                Pizza
              </button>
              <button
                aria-pressed={chartType === 'bar'}
                onClick={() => setChartType('bar')}
                className={`px-2 py-1 text-sm ${chartType === 'bar' ? 'bg-accent text-foreground' : 'bg-transparent'}`}
              >
                Barras
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 w-full bg-muted animate-pulse rounded" />
        ) : data.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Nenhum dado disponível</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                />
                <Legend />
              </PieChart>
            ) : (
              <BarChart data={data.map(d => ({ name: d.name, value: d.value }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
