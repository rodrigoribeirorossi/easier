import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './components/dashboard/Dashboard'
import { TransactionList } from './components/transactions/TransactionList'
import { AccountList } from './components/accounts/AccountList'
import { FinancialCalendar } from './components/calendar/FinancialCalendar'
import { PaymentList } from './components/payments/PaymentList'
import { InvestmentSimulator } from './components/investments/InvestmentSimulator'
import { Reports } from './components/reports/Reports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<TransactionList />} />
          <Route path="accounts" element={<AccountList />} />
          <Route path="calendar" element={<FinancialCalendar />} />
          <Route path="payments" element={<PaymentList />} />
          <Route path="investments" element={<InvestmentSimulator />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
