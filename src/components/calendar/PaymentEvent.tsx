import { formatCurrency } from '@/lib/formatters'
import { Plus } from 'lucide-react'

interface PaymentEventProps {
  payment: any
  onClick?: () => void
}

export function PaymentEvent({ payment, onClick }: PaymentEventProps) {
  const statusColors = {
    pending: 'bg-yellow-500',
    paid: 'bg-green-500',
    overdue: 'bg-red-500',
  }

  // Use explicit style by item type: detect income via several possible fields
  const isIncome = Boolean(
    payment && (
      payment._type === 'income' ||
      payment.type === 'income' ||
      (payment.category && payment.category.type === 'income')
    )
  )

  const cleanName = (name: any) => {
    try {
      // remove leading plus signs, fullwidth plus, nbsp and surrounding spaces
      return String(name).replace(/^[\s\+\uFF0B\u00A0]+/, '')
    } catch {
      return name
    }
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-1 rounded hover:bg-accent transition-colors group"
    >
      <div className="flex items-center gap-1">
        {isIncome ? (
          <div className="h-4 w-4 flex items-center justify-center flex-shrink-0">
            <Plus className="h-3 w-3 text-green-500" />
          </div>
        ) : (
          <div className="h-4 w-4 flex items-center justify-center flex-shrink-0">
            <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          </div>
        )}
        <span className="text-xs truncate group-hover:text-foreground">
          {isIncome ? cleanName(payment.name) : payment.name}
        </span>
      </div>
      <p className={`text-xs mt-0.5 ${isIncome ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
        {formatCurrency(payment.amount)}
      </p>
    </button>
  )
}
