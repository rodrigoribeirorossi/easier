import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Criar usuário principal com senha para testes
  const passwordPlain = 'password123'
  const passwordHash = await bcrypt.hash(passwordPlain, 10)

  const user = await prisma.user.upsert({
    where: { email: 'user@easier.com' },
    update: {
      // garante que o admin tenha senha nos testes
      passwordHash,
    },
    create: {
      email: 'user@easier.com',
      name: 'Usuário Principal',
      role: 'admin',
      passwordHash,
    },
  })

  console.log('Usuário criado:', user)
  console.log('Credenciais de teste: user@easier.com / password123')

  // Criar categorias
  const categories = await Promise.all([
    // Categorias de despesa
    prisma.category.create({
      data: {
        name: 'Alimentação',
        icon: 'utensils',
        color: '#ef4444',
        type: 'expense',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Transporte',
        icon: 'car',
        color: '#f59e0b',
        type: 'expense',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Moradia',
        icon: 'home',
        color: '#8b5cf6',
        type: 'expense',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Lazer',
        icon: 'music',
        color: '#ec4899',
        type: 'expense',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Saúde',
        icon: 'heart-pulse',
        color: '#22c55e',
        type: 'expense',
      },
    }),
    // Categorias de receita
    prisma.category.create({
      data: {
        name: 'Salário',
        icon: 'briefcase',
        color: '#22c55e',
        type: 'income',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Freelance',
        icon: 'laptop',
        color: '#3b82f6',
        type: 'income',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Investimentos',
        icon: 'trending-up',
        color: '#8b5cf6',
        type: 'income',
      },
    }),
  ])

  console.log('Categorias criadas:', categories.length)

  // Criar contas
  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        name: 'Conta Corrente',
        type: 'checking',
        balance: 5000,
        color: '#3b82f6',
        icon: 'building-2',
        userId: user.id,
      },
    }),
    prisma.account.create({
      data: {
        name: 'Poupança',
        type: 'savings',
        balance: 10000,
        color: '#22c55e',
        icon: 'piggy-bank',
        userId: user.id,
      },
    }),
    prisma.account.create({
      data: {
        name: 'Cartão de Crédito',
        type: 'credit_card',
        balance: -1500,
        color: '#ef4444',
        icon: 'credit-card',
        userId: user.id,
      },
    }),
    prisma.account.create({
      data: {
        name: 'Carteira Digital',
        type: 'wallet',
        balance: 500,
        color: '#8b5cf6',
        icon: 'wallet',
        userId: user.id,
      },
    }),
  ])

  console.log('Contas criadas:', accounts.length)

  // Criar transações dos últimos 3 meses
  const transactions = []
  const now = new Date()
  
  for (let i = 0; i < 90; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Algumas transações de entrada
    if (i % 30 === 0) {
      transactions.push(
        prisma.transaction.create({
          data: {
            type: 'income',
            amount: 5000,
            description: 'Salário',
            date: date,
            accountId: accounts[0].id,
            categoryId: categories[5].id,
            userId: user.id,
          },
        })
      )
    }
    
    // Transações de saída aleatórias
    if (Math.random() > 0.7) {
      const expenseCategories = categories.slice(0, 5)
      const randomCategory = expenseCategories[Math.floor(Math.random() * expenseCategories.length)]
      const randomAccount = accounts[Math.floor(Math.random() * 2)]
      
      transactions.push(
        prisma.transaction.create({
          data: {
            type: 'expense',
            amount: Math.random() * 500 + 20,
            description: `Compra em ${randomCategory.name}`,
            date: date,
            accountId: randomAccount.id,
            categoryId: randomCategory.id,
            userId: user.id,
          },
        })
      )
    }
  }

  await Promise.all(transactions)
  console.log('Transações criadas:', transactions.length)

  // Criar pagamentos
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        name: 'Aluguel',
        amount: 1500,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
        isRecurring: true,
        frequency: 'monthly',
        status: 'pending',
        categoryId: categories[2].id,
        accountId: accounts[0].id,
        userId: user.id,
      },
    }),
    prisma.payment.create({
      data: {
        name: 'Energia Elétrica',
        amount: 200,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
        isRecurring: true,
        frequency: 'monthly',
        status: 'pending',
        categoryId: categories[2].id,
        accountId: accounts[0].id,
        userId: user.id,
      },
    }),
    prisma.payment.create({
      data: {
        name: 'Internet',
        amount: 100,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
        isRecurring: true,
        frequency: 'monthly',
        status: 'paid',
        categoryId: categories[2].id,
        accountId: accounts[0].id,
        userId: user.id,
      },
    }),
    prisma.payment.create({
      data: {
        name: 'Seguro do Carro',
        amount: 150,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 20),
        isRecurring: true,
        frequency: 'monthly',
        status: 'pending',
        categoryId: categories[1].id,
        accountId: accounts[0].id,
        userId: user.id,
      },
    }),
  ])

  console.log('Pagamentos criados:', payments.length)

  // Criar investimentos
  const investments = await Promise.all([
    prisma.investment.create({
      data: {
        name: 'Poupança',
        type: 'savings',
        initialAmount: 5000,
        currentAmount: 5154.25,
        annualRate: 6.17,
        startDate: new Date(now.getFullYear() - 1, 0, 1),
        userId: user.id,
      },
    }),
    prisma.investment.create({
      data: {
        name: 'CDB 100% CDI',
        type: 'cdb',
        initialAmount: 10000,
        currentAmount: 11325,
        annualRate: 13.25,
        startDate: new Date(now.getFullYear() - 1, 0, 1),
        userId: user.id,
      },
    }),
    prisma.investment.create({
      data: {
        name: 'Tesouro IPCA+',
        type: 'treasury',
        initialAmount: 8000,
        currentAmount: 8920,
        annualRate: 11.5,
        startDate: new Date(now.getFullYear() - 1, 0, 1),
        maturityDate: new Date(now.getFullYear() + 4, 0, 1),
        userId: user.id,
      },
    }),
  ])

  console.log('Investimentos criados:', investments.length)

  console.log('Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
