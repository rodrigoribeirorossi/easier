import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Account } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AccountCard } from './AccountCard'
import { AccountForm } from './AccountForm'
import { formatCurrency } from '@/lib/formatters'

export function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    try {
      setLoading(true)
      const data = await api.getAccounts()
      setAccounts(data)
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(data: any) {
    if (selectedAccount) {
      await api.updateAccount(selectedAccount.id, data)
    } else {
      await api.createAccount(data)
    }
    loadAccounts()
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      await api.deleteAccount(id)
      loadAccounts()
    }
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Contas</h2>
          <p className="text-muted-foreground mt-1">
            Saldo Total: <span className="font-semibold text-foreground">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <Button onClick={() => { setSelectedAccount(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Nenhuma conta cadastrada</p>
          <Button onClick={() => { setSelectedAccount(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeira Conta
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={(acc) => { setSelectedAccount(acc); setDialogOpen(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AccountForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={selectedAccount}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
