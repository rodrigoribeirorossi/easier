import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Transaction, Account, Category } from '@/types'

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
  accounts: Account[]
  categories: Category[]
  onSubmit: (data: any) => Promise<void>
}

export function TransactionForm({ open, onOpenChange, transaction, accounts, categories, onSubmit }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    categoryId: '',
    isRecurring: false,
    frequency: 'monthly',
    recurrenceEndDate: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        description: transaction.description,
        date: new Date(transaction.date).toISOString().split('T')[0],
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
        isRecurring: transaction.isRecurring,
        frequency: transaction.frequency || 'monthly',
        recurrenceEndDate: transaction.recurrenceEndDate ? new Date(transaction.recurrenceEndDate).toISOString().split('T')[0] : '',
      })
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        accountId: accounts[0]?.id || '',
        categoryId: '',
        isRecurring: false,
        frequency: 'monthly',
        recurrenceEndDate: '',
      })
    }
  }, [transaction, accounts, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        recurrenceEndDate: formData.recurrenceEndDate || null,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to submit transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(c => c.type === formData.type || formData.type === 'transfer')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="isRecurring" className="cursor-pointer">
              Recorrente
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
                {filteredCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
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
