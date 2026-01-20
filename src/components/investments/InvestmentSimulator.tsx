import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InvestmentCard } from './InvestmentCard'
import { ProjectionChart } from './ProjectionChart'

interface InvestmentType {
  type: string
  name: string
  rate: number
  color: string
}

const investmentTypes: InvestmentType[] = [
  { type: 'savings', name: 'Poupança', rate: 6.17, color: '#10b981' },
  { type: 'cdb', name: 'CDB', rate: 12.0, color: '#3b82f6' },
  { type: 'treasury', name: 'Tesouro Direto', rate: 11.5, color: '#8b5cf6' },
  { type: 'fixed_income', name: 'Renda Fixa', rate: 13.0, color: '#f59e0b' },
  { type: 'stocks', name: 'Ações', rate: 15.0, color: '#ec4899' },
]

function calculateInvestment(initialAmount: number, monthlyContribution: number, months: number, annualRate: number) {
  const monthlyRate = annualRate / 100 / 12
  let total = initialAmount
  const data = [{ month: 0, amount: total }]

  for (let i = 1; i <= months; i++) {
    total = (total + monthlyContribution) * (1 + monthlyRate)
    data.push({ month: i, amount: total })
  }

  const totalContributed = initialAmount + (monthlyContribution * months)
  const totalEarnings = total - totalContributed

  return {
    finalAmount: total,
    totalContributed,
    totalEarnings,
    data,
  }
}

export function InvestmentSimulator() {
  const [initialAmount, setInitialAmount] = useState(10000)
  const [monthlyContribution, setMonthlyContribution] = useState(1000)
  const [months, setMonths] = useState(12)
  const [selectedTab, setSelectedTab] = useState('all')

  const simulations = investmentTypes.map(investment => {
    const result = calculateInvestment(initialAmount, monthlyContribution, months, investment.rate)
    return {
      ...investment,
      ...result,
    }
  })

  const getProjections = () => {
    if (selectedTab === 'all') {
      return simulations.map(s => ({
        name: s.name,
        data: s.data,
        color: s.color,
      }))
    }
    
    const selected = simulations.find(s => s.type === selectedTab)
    return selected ? [{
      name: selected.name,
      data: selected.data,
      color: selected.color,
    }] : []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Simulador de Investimentos</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros de Simulação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="initial">Valor Inicial (R$)</Label>
              <Input
                id="initial"
                type="number"
                step="100"
                min="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly">Aporte Mensal (R$)</Label>
              <Input
                id="monthly"
                type="number"
                step="100"
                min="0"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Período (meses)</Label>
              <Input
                id="period"
                type="number"
                step="1"
                min="1"
                max="360"
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="savings">Poupança</TabsTrigger>
          <TabsTrigger value="cdb">CDB</TabsTrigger>
          <TabsTrigger value="treasury">Tesouro</TabsTrigger>
          <TabsTrigger value="fixed_income">Renda Fixa</TabsTrigger>
          <TabsTrigger value="stocks">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6 space-y-6">
          <ProjectionChart projections={getProjections()} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {selectedTab === 'all' ? (
              simulations.map((simulation) => (
                <InvestmentCard
                  key={simulation.type}
                  name={simulation.name}
                  rate={simulation.rate}
                  finalAmount={simulation.finalAmount}
                  totalContributed={simulation.totalContributed}
                  totalEarnings={simulation.totalEarnings}
                  color={simulation.color}
                />
              ))
            ) : (
              simulations
                .filter(s => s.type === selectedTab)
                .map((simulation) => (
                  <InvestmentCard
                    key={simulation.type}
                    name={simulation.name}
                    rate={simulation.rate}
                    finalAmount={simulation.finalAmount}
                    totalContributed={simulation.totalContributed}
                    totalEarnings={simulation.totalEarnings}
                    color={simulation.color}
                  />
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
