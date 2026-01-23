#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'

(async () => {
  const prisma = new PrismaClient()
  try {
    const userId = process.argv[2] || '20f0f09c-741d-4104-8678-37a997d31a58'
    console.log('Resetting data for user:', userId)

    // Delete transactions, payments, investments, then accounts
    const txDel = await prisma.transaction.deleteMany({ where: { userId } })
    console.log('Deleted transactions:', txDel.count)

    const payDel = await prisma.payment.deleteMany({ where: { userId } })
    console.log('Deleted payments:', payDel.count)

    const invDel = await prisma.investment.deleteMany({ where: { userId } })
    console.log('Deleted investments:', invDel.count)

    const accDel = await prisma.account.deleteMany({ where: { userId } })
    console.log('Deleted accounts:', accDel.count)

    console.log('Reset complete')
    process.exit(0)
  } catch (err) {
    console.error('Error resetting data:', err)
    process.exit(1)
  } finally {
    try { await prisma.$disconnect() } catch {}
  }
})()
