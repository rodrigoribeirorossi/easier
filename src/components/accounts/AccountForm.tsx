import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Account } from '@/types'

interface AccountFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: Account | null
  onSubmit: (data: any) => Promise<void>
}

const accountColors = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Amarelo', value: '#f59e0b' },
  { name: 'Rosa', value: '#ec4899' },
]

export function AccountForm({ open, onOpenChange, account, onSubmit }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    balance: '',
    color: '#3b82f6',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance.toString(),
        color: account.color,
      })
    } else {
      setFormData({
        name: '',
        type: 'checking',
        balance: '0',
        color: '#3b82f6',
      })
    }
  }, [account, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        ...formData,
        balance: parseFloat(formData.balance),
        currency: 'BRL',
        icon: 'wallet',
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to submit account:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {account ? 'Editar Conta' : 'Nova Conta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Conta Corrente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Conta</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Conta Corrente</SelectItem>
                <SelectItem value="savings">Poupança</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="wallet">Carteira Digital</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Saldo Inicial (R$)</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <div className="grid grid-cols-6 gap-2">
              {accountColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`h-10 rounded-lg border-2 transition-all ${
                    formData.color === color.value ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  title={color.name}
                />
              ))}
            </div>
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
