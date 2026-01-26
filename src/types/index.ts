export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'member'
  createdAt: Date
  updatedAt: Date
  occurrences?: PaymentOccurrence[]
}

export interface Account {
  id: string
  name: string
  type: 'checking' | 'savings' | 'credit_card' | 'wallet' | 'cash'
  balance: number
  currency: string
  color: string
  icon: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: 'income' | 'expense'
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  description: string
  date: Date
  isRecurring: boolean
  recurrenceEndDate?: Date | null
  frequency?: 'monthly' | 'weekly' | 'yearly'
  tags?: string[]
  accountId: string
  categoryId: string
  userId: string
  account?: Account
  category?: Category
  createdAt: Date
  updatedAt: Date
}

export interface Payment {
  id: string
  name: string
  amount: number
  dueDate: Date
  isRecurring: boolean
  frequency?: 'monthly' | 'weekly' | 'yearly'
  /** Optional end date for recurrence (if payment is recurring) */
  recurrenceEndDate?: Date | null
  status: 'pending' | 'paid' | 'overdue'
  categoryId: string
  accountId?: string
  userId: string
  category?: Category
  account?: Account
  /** If the backend stores explicit occurrence records for this recurring payment */
  occurrences?: PaymentOccurrence[]
  createdAt: Date
  updatedAt: Date
}

export interface PaymentOccurrence {
  id: string
  paymentId: string
  dueDate: Date
  status: 'pending' | 'paid' | 'overdue'
  createdAt: Date
  updatedAt: Date
}

export interface Investment {
  id: string
  name: string
  type: 'savings' | 'cdb' | 'treasury' | 'fixed_income' | 'stocks'
  initialAmount: number
  currentAmount: number
  annualRate: number
  startDate: Date
  maturityDate?: Date
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface InvestmentSimulation {
  type: string
  name: string
  rate: number
  initialAmount: number
  monthlyContribution: number
  months: number
  finalAmount: number
  totalContributed: number
  totalEarnings: number
  data: { month: number; amount: number }[]
}

export interface DashboardSummary {
  totalBalance: number
  monthIncome: number
  monthExpenses: number
  monthSavings: number
  totalInvestments: number
}
