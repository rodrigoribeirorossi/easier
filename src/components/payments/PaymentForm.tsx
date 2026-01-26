import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Payment, Account, Category } from '@/types'

interface PaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment?: Payment | null
  accounts: Account[]
  categories: Category[]
  onSubmit: (data: any) => Promise<void>
}

export function PaymentForm({ open, onOpenChange, payment, accounts, categories, onSubmit }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
    frequency: 'monthly',
    status: 'pending',
    categoryId: '',
    accountId: '',
    recurrenceEndDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (payment) {
      setFormData({
        name: payment.name,
        amount: payment.amount.toString(),
        dueDate: new Date(payment.dueDate).toISOString().split('T')[0],
        isRecurring: payment.isRecurring,
        frequency: payment.frequency || 'monthly',
        status: payment.status,
        categoryId: payment.categoryId,
        accountId: payment.accountId || '',
        recurrenceEndDate: payment.recurrenceEndDate ? new Date(payment.recurrenceEndDate).toISOString().split('T')[0] : '',
      })
    } else {
      setFormData({
        name: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        isRecurring: false,
        frequency: 'monthly',
        status: 'pending',
        categoryId: categories[0]?.id || '',
        accountId: accounts[0]?.id || '',
        recurrenceEndDate: '',
      })
    }
  }, [payment, accounts, categories, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      setError(null)
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        recurrenceEndDate: formData.recurrenceEndDate || null,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to submit payment:', error)
      try {
        setError((error as Error).message || 'Erro ao salvar pagamento')
      } catch {
        setError('Erro ao salvar pagamento')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {payment ? 'Editar Pagamento' : 'Novo Pagamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Aluguel"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="isRecurring" className="cursor-pointer">
              Pagamento Recorrente
            </Label>
          </div>

          {formData.isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência</Label>
              <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="recurrenceEndDate">Data de Fim</Label>
              <Input
                id="recurrenceEndDate"
                type="date"
                value={formData.recurrenceEndDate}
                onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                aria-label="Data de fim da recorrência"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">Conta</Label>
            <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
              <SelectTrigger id="account">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            {error && <div className="text-sm text-red-500 mr-auto">{error}</div>}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
