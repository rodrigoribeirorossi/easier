import { formatCurrency } from '@/lib/formatters'
import { Payment } from '@/types'

interface PaymentEventProps {
  payment: Payment
  onClick?: () => void
}

export function PaymentEvent({ payment, onClick }: PaymentEventProps) {
  const statusColors = {
    pending: 'bg-yellow-500',
    paid: 'bg-green-500',
    overdue: 'bg-red-500',
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-1 rounded hover:bg-accent transition-colors group"
    >
      <div className="flex items-center gap-1">
        <div className={`h-2 w-2 rounded-full ${statusColors[payment.status]}`} />
        <span className="text-xs truncate group-hover:text-foreground">
          {payment.name}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        {formatCurrency(payment.amount)}
      </p>
    </button>
  )
}
