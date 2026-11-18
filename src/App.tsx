import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React from 'react'
import { IncomeList as Income } from './components/incomes/IncomeList'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './components/dashboard/Dashboard'
import { TransactionList } from './components/transactions/TransactionList'
import { AccountList } from './components/accounts/AccountList'
import { FinancialCalendar } from './components/calendar/FinancialCalendar'
import { PaymentList } from './components/payments/PaymentList'
import { InvestmentSimulator } from './components/investments/InvestmentSimulator'
import { Reports } from './components/reports/Reports'
import { DebtPage } from './components/debts/DebtPage'
import { LoginPage } from './components/auth/LoginPage'
import { RegisterPage } from './components/auth/RegisterPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<TransactionList />} />
            <Route path="incomes" element={<Income />} />
            <Route path="accounts" element={<AccountList />} />
            <Route path="calendar" element={<FinancialCalendar />} />
            <Route path="payments" element={<PaymentList />} />
            <Route path="investments" element={<InvestmentSimulator />} />
            <Route path="debts" element={<DebtPage />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
