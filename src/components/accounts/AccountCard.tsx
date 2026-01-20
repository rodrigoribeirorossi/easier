import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Account } from '@/types'
import { formatCurrency, getAccountTypeLabel } from '@/lib/formatters'
import { Wallet, Edit, Trash2 } from 'lucide-react'

interface AccountCardProps {
  account: Account
  onEdit: (account: Account) => void
  onDelete: (id: string) => void
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const isNegative = account.balance < 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${account.color}20` }}
            >
              <Wallet className="h-5 w-5" style={{ color: account.color }} />
            </div>
            <div>
              <CardTitle className="text-lg">{account.name}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {getAccountTypeLabel(account.type)}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(account)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDelete(account.id)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Saldo Atual</p>
          <p className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-foreground'}`}>
            {formatCurrency(account.balance)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
