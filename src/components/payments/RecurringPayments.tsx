import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Payment } from '@/types'
import { formatCurrency, formatDate, getFrequencyLabel, generateRecurringDates } from '@/lib/formatters'
import { Repeat, CheckCircle, Edit, Trash2 } from 'lucide-react'

interface RecurringPaymentsProps {
  payments: Payment[]
  loading?: boolean
  onEdit?: (payment: Payment) => void
  onDelete?: (id: string) => void
  onMarkAsPaid?: (payment: Payment) => void
}

export function RecurringPayments({ payments, loading, onEdit, onDelete, onMarkAsPaid }: RecurringPaymentsProps) {
  const recurringPayments = payments.filter(p => p.isRecurring)
  const [showAll, setShowAll] = useState(false)

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
  const displayed = showAll ? recurringPayments : recurringPayments.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamentos Recorrentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayed.map((payment) => (
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
                  Próximo vencimento: {(() => {
                    const dates = generateRecurringDates(payment.dueDate, payment.frequency, payment.recurrenceEndDate || null, 12)
                    const today = new Date()
                    const next = dates.find(d => new Date(d) >= new Date(today)) || dates[dates.length - 1]
                    if (!next) return formatDate(payment.dueDate)
                    const occ = (payment.occurrences || []).find((o: any) => {
                      const od = new Date(o.dueDate)
                      return od.getFullYear() === next.getFullYear() && od.getMonth() === next.getMonth() && od.getDate() === next.getDate()
                    })
                    return occ ? formatDate(occ.dueDate) : formatDate(next)
                  })()}
                </p>
              </div>

              <div className="text-right flex items-center gap-2">
                <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                <div className="flex gap-1">
                  {onMarkAsPaid && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onMarkAsPaid(payment)}
                      title="Marcar como pago"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(payment)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(payment.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {recurringPayments.length > 5 && (
            <div className="mt-3 flex justify-center">
              <Button variant="ghost" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Mostrar menos' : 'Mostrar todos'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
