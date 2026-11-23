import { formatCurrency } from '@/lib/formatters'
import { Plus, CheckCircle2, Clock, AlertCircle, Landmark, HandCoins, CreditCard } from 'lucide-react'

interface PaymentEventProps {
  payment: any
  onClick?: () => void
}

const STATUS_CONFIG = {
  paid:    { icon: CheckCircle2, color: 'text-green-500',  label: 'Pago'      },
  pending: { icon: Clock,        color: 'text-amber-500',  label: 'Pendente'  },
  overdue: { icon: AlertCircle,  color: 'text-red-500',    label: 'Atrasado'  },
} as const

export function PaymentEvent({ payment, onClick }: PaymentEventProps) {
  // Use explicit style by item type: detect income via several possible fields
  const isIncome = Boolean(
    payment && (
      payment._type === 'income' ||
      payment.type === 'income' ||
      (payment.category && payment.category.type === 'income')
    )
  )

  const isDebt = Boolean(payment && (payment._type === 'debt' || payment.type === 'debt'))
  const isCreditCardInvoice = payment?._type === 'creditCardInvoice'

  const cleanName = (name: any) => {
    try {
      return String(name).replace(/^[\s\+\uFF0B\u00A0]+/, '')
    } catch {
      return name
    }
  }

  const status = payment?.status as keyof typeof STATUS_CONFIG
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon

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
        ) : isDebt ? (
          <div className="h-4 w-4 flex items-center justify-center flex-shrink-0" title={payment._debt?.type === 'loan' ? 'Empréstimo' : 'Financiamento'}>
            {payment._debt?.type === 'loan'
              ? <HandCoins className="h-3 w-3 text-orange-500" />
              : <Landmark className="h-3 w-3 text-blue-500" />
            }
          </div>
        ) : isCreditCardInvoice ? (
          <div className="h-4 w-4 flex items-center justify-center flex-shrink-0" title="Fatura de cartão de crédito">
            <CreditCard className="h-3 w-3 text-primary" />
          </div>
        ) : (
          <div className="h-4 w-4 flex items-center justify-center flex-shrink-0" title={statusCfg.label}>
            <StatusIcon className={`h-3 w-3 ${statusCfg.color}`} />
          </div>
        )}
        <span className="text-xs truncate group-hover:text-foreground">
          {isIncome ? cleanName(payment.name) : payment.name}
        </span>
      </div>
      <p className={`text-xs mt-0.5 ${isIncome ? 'text-green-600 font-medium' : isDebt ? (payment._debt?.type === 'loan' ? 'text-orange-500 font-medium' : 'text-blue-600 font-medium') : 'text-muted-foreground'}`}>
        {formatCurrency(payment.amount)}
      </p>
    </button>
  )
}
