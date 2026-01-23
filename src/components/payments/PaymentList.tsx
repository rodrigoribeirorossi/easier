import { useState, useEffect } from 'react'
import useUser from '@/hooks/useUser'
import { api } from '@/lib/api'
import { Payment, Account, Category } from '@/types'
import { formatCurrency, formatDate, getPaymentStatusLabel } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react'
import { PaymentForm } from './PaymentForm'
import { RecurringPayments } from './RecurringPayments'

export function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const { user } = useUser()

  useEffect(() => {
    if (!user) {
      setPayments([])
      setAccounts([])
      setCategories([])
      setLoading(false)
      return
    }
    loadData()
  }, [user && user.id])

  async function loadData() {
    try {
      setLoading(true)
      const [pmts, accs, cats] = await Promise.all([
        api.getPayments(),
        api.getAccounts(),
        api.getCategories('expense'),
      ])
      setPayments(pmts)
      setAccounts(accs)
      setCategories(cats)
    } catch (error) {
      console.error('Failed to load payments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(data: any) {
    if (selectedPayment) {
      await api.updatePayment(selectedPayment.id, data)
    } else {
      await api.createPayment(data)
    }
    loadData()
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir este pagamento?')) {
      await api.deletePayment(id)
      loadData()
    }
  }

  async function handleMarkAsPaid(payment: Payment) {
    await api.updatePayment(payment.id, { ...payment, status: 'paid' })
    loadData()
  }

  const getFilteredPayments = () => {
    switch (activeTab) {
      case 'pending':
        return payments.filter(p => p.status === 'pending')
      case 'paid':
        return payments.filter(p => p.status === 'paid')
      case 'overdue':
        return payments.filter(p => p.status === 'overdue')
      default:
        return payments
    }
  }

  const filteredPayments = getFilteredPayments()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500'
      case 'overdue':
        return 'bg-red-500'
      default:
        return 'bg-yellow-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Pagamentos</h2>
        <Button onClick={() => { setSelectedPayment(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pagamento
        </Button>
      </div>

      <RecurringPayments payments={payments} loading={loading} />

      <Card>
        <CardHeader>
          <CardTitle>Todos os Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="paid">Pagos</TabsTrigger>
              <TabsTrigger value="overdue">Atrasados</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                      <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pagamento encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(payment.status)}`} />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{payment.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {getPaymentStatusLabel(payment.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>Vencimento: {formatDate(payment.dueDate)}</span>
                          {payment.category && (
                            <>
                              <span>•</span>
                              <span>{payment.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold">
                          {formatCurrency(payment.amount)}
                        </span>

                        <div className="flex gap-1">
                          {payment.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkAsPaid(payment)}
                              title="Marcar como pago"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedPayment(payment); setDialogOpen(true); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(payment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <PaymentForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={selectedPayment}
        accounts={accounts}
        categories={categories}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
