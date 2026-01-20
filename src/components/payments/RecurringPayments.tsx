import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Payment } from '@/types'
import { formatCurrency, formatDate, getFrequencyLabel } from '@/lib/formatters'
import { Repeat } from 'lucide-react'

interface RecurringPaymentsProps {
  payments: Payment[]
  loading?: boolean
}

export function RecurringPayments({ payments, loading }: RecurringPaymentsProps) {
  const recurringPayments = payments.filter(p => p.isRecurring)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos Recorrentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recurringPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos Recorrentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum pagamento recorrente configurado
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamentos Recorrentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recurringPayments.map((payment) => (
            <div key={payment.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
              <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950">
                <Repeat className="h-5 w-5 text-blue-600" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{payment.name}</p>
                  {payment.frequency && (
                    <Badge variant="outline" className="text-xs">
                      {getFrequencyLabel(payment.frequency)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Próximo vencimento: {formatDate(payment.dueDate)}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">{formatCurrency(payment.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
