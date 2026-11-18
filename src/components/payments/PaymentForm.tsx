import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { Payment, Account, Category } from '@/types'

interface PaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment?: Payment | null
  accounts: Account[]
  categories: Category[]
  onSubmit: (data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function PaymentForm({ open, onOpenChange, payment, accounts, categories, onSubmit, onDelete }: PaymentFormProps) {
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
  const [localCategories, setLocalCategories] = useState<Category[]>(categories || [])
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  const dedupeCategories = (list: Category[]) => {
    const byKey = new Map<string, Category>()
    for (const item of list || []) {
      const key = `${item.type}:${String(item.name || '').trim().toLowerCase()}`
      if (!byKey.has(key)) byKey.set(key, item)
    }
    return Array.from(byKey.values())
  }

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
    const initCats = async () => {
      if (!categories || (categories && categories.length === 0)) {
        try {
          const fetched = await api.getCategories('expense')
          const list = Array.isArray(fetched) ? fetched : []
          setLocalCategories(dedupeCategories(list))
        } catch (err) {
          console.error('Failed to fetch categories in PaymentForm:', err)
          setLocalCategories(dedupeCategories(Array.isArray(categories) ? categories : []))
        }
      } else {
        setLocalCategories(dedupeCategories(Array.isArray(categories) ? categories : []))
      }
    }
    initCats()
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

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    setCreatingCategory(true)
    try {
      const created = await api.createCategory({ name: newCategoryName.trim(), type: 'expense' })
      const updated = [...(localCategories || []), created]
      setLocalCategories(dedupeCategories(updated))
      setFormData({ ...formData, categoryId: created.id })
      setNewCategoryName('')
      setShowNewCategory(false)
    } catch (err) {
      console.error('Failed to create category:', err)
      setError((err as Error).message || 'Erro ao criar categoria')
    } finally {
      setCreatingCategory(false)
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
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {(localCategories || []).map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                {!showNewCategory ? (
                  <Button variant="outline" onClick={() => { setShowNewCategory(true); setNewCategoryName('') }}>Nova</Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nova categoria" />
                    <Button onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()}>
                      {creatingCategory ? 'Criando...' : 'Criar'}
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowNewCategory(false); setNewCategoryName('') }}>Cancelar</Button>
                  </div>
                )}
              </div>
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

          <DialogFooter>
            {payment && onDelete && (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={async () => {
                  if (!confirm('Tem certeza que deseja excluir este pagamento?')) return
                  const baseId = payment.id.includes('::') ? payment.id.split('::')[0] : payment.id
                  await onDelete(baseId)
                  onOpenChange(false)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
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
