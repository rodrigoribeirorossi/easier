import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getDaysUntil, isOverdue, generateRecurringDates, expandRecurringPaymentOccurrences } from '@/lib/formatters'
import { Payment } from '@/types'
import { Clock, AlertCircle } from 'lucide-react'

interface UpcomingPaymentsProps {
  payments: Payment[]
  loading?: boolean
}

export function UpcomingPayments({ payments, loading }: UpcomingPaymentsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximos Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximos Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum pagamento pendente
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Pagamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(() => {
            const occurrences: any[] = []
            const today = new Date()

            payments.forEach(p => {
              if (p.isRecurring) {
                  const dates = generateRecurringDates(p.dueDate, p.frequency, p.recurrenceEndDate || null, 12)
                  const next = dates.find(d => new Date(d) >= new Date(today))
                  if (next) {
                    // prefer backend occurrence if exists
                    const occ = (p.occurrences || []).find((o: any) => {
                      const od = new Date(o.dueDate)
                      return od.getFullYear() === next.getFullYear() && od.getMonth() === next.getMonth() && od.getDate() === next.getDate()
                    })
                    if (occ) occurrences.push({ ...p, id: occ.id, dueDate: new Date(occ.dueDate), status: occ.status })
                    else occurrences.push({ ...p, id: `${p.id}::${next.toISOString()}`, dueDate: next })
                }
              } else {
                occurrences.push(p)
              }
            })

            const sorted = occurrences.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5)

            return sorted.map(payment => {
              const daysUntil = getDaysUntil(payment.dueDate)
              const overdue = isOverdue(payment.dueDate)

              return (
                <div key={payment.id} className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    overdue ? 'bg-red-50 dark:bg-red-950' : 'bg-blue-50 dark:bg-blue-950'
                  }`}>
                    {overdue ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">{payment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.dueDate)}
                      {' - '}
                      {overdue ? (
                        <span className="text-red-600">
                          {Math.abs(daysUntil)} dias atrasado
                        </span>
                      ) : daysUntil === 0 ? (
                        <span className="text-orange-600">Vence hoje</span>
                      ) : (
                        <span>Vence em {daysUntil} dias</span>
                      )}
                    </p>
                  </div>

                  <Badge variant={overdue ? 'destructive' : 'secondary'}>
                    {formatCurrency(payment.amount)}
                  </Badge>
                </div>
              )
            })
          })()}
        </div>
      </CardContent>
    </Card>
  )
}
