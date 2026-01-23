#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'

(async () => {
  const prisma = new PrismaClient()
  try {
    const keepEmail = process.argv[2] || process.env.MAIN_USER_EMAIL || 'user@easier.com'
    console.log('Keeping user with email:', keepEmail)

    const keepUser = await prisma.user.findUnique({ where: { email: String(keepEmail) } })
    if (!keepUser) {
      console.error('Main user not found:', keepEmail)
      process.exit(1)
    }

    const usersToDelete = await prisma.user.findMany({
      where: { email: { not: keepEmail } },
      select: { id: true, email: true },
    })

    if (usersToDelete.length === 0) {
      console.log('No other users found. Nothing to delete.')
      process.exit(0)
    }

    const ids = usersToDelete.map(u => u.id)
    console.log('Found users to delete:', usersToDelete.map(u=>u.email))

    const txDel = await prisma.transaction.deleteMany({ where: { userId: { in: ids } } })
    console.log('Deleted transactions:', txDel.count)

    const payDel = await prisma.payment.deleteMany({ where: { userId: { in: ids } } })
    console.log('Deleted payments:', payDel.count)

    const invDel = await prisma.investment.deleteMany({ where: { userId: { in: ids } } })
    console.log('Deleted investments:', invDel.count)

    const accDel = await prisma.account.deleteMany({ where: { userId: { in: ids } } })
    console.log('Deleted accounts:', accDel.count)

    const userDel = await prisma.user.deleteMany({ where: { id: { in: ids } } })
    console.log('Deleted users:', userDel.count)

    console.log('Cleanup complete')
    process.exit(0)
  } catch (err) {
    console.error('Error removing users:', err)
    process.exit(1)
  } finally {
    try { await prisma.$disconnect() } catch {}
  }
})()
