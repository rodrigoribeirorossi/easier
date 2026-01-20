import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { TrendingUp } from 'lucide-react'

interface InvestmentCardProps {
  name: string
  rate: number
  finalAmount: number
  totalContributed: number
  totalEarnings: number
  color: string
}

export function InvestmentCard({
  name,
  rate,
  finalAmount,
  totalContributed,
  totalEarnings,
  color,
}: InvestmentCardProps) {
  const roi = ((totalEarnings / totalContributed) * 100)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <TrendingUp className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {formatPercent(rate)} a.a.
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Valor Final</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(finalAmount)}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Investido</p>
            <p className="font-semibold">{formatCurrency(totalContributed)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rendimento</p>
            <p className="font-semibold text-green-600">
              {formatCurrency(totalEarnings)}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ROI</span>
            <span className="font-semibold text-green-600">
              {formatPercent(roi)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
