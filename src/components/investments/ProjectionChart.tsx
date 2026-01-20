import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { formatCurrency } from '@/lib/formatters'

interface ProjectionData {
  month: number
  amount: number
}

interface InvestmentProjection {
  name: string
  data: ProjectionData[]
  color: string
}

interface ProjectionChartProps {
  projections: InvestmentProjection[]
  loading?: boolean
}

export function ProjectionChart({ projections, loading }: ProjectionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projeção de Crescimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  const allMonths = projections[0]?.data.map(d => d.month) || []
  
  const chartData = allMonths.map(month => {
    const dataPoint: any = { month }
    projections.forEach(proj => {
      const point = proj.data.find(d => d.month === month)
      dataPoint[proj.name] = point?.amount || 0
    })
    return dataPoint
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projeção de Crescimento</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month"
              label={{ value: 'Meses', position: 'insideBottom', offset: -5 }}
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
              labelFormatter={(label) => `Mês ${label}`}
            />
            <Legend />
            {projections.map((proj) => (
              <Line
                key={proj.name}
                type="monotone"
                dataKey={proj.name}
                stroke={proj.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
