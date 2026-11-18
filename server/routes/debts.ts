import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/debts
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string)
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const debts = await prisma.debt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(debts);
  } catch (error) {
    console.error('Error fetching debts:', error);
    res.status(500).json({ error: 'Failed to fetch debts' });
  }
});

// GET /api/debts/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string)
    const id = req.params.id as string;
    const debt = await prisma.debt.findFirst({
      where: { id, userId },
    });
    if (!debt) return res.status(404).json({ error: 'Debt not found' });
    res.json(debt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch debt' });
  }
});

// POST /api/debts
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.body.userId as string)
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, totalAmount, remainingAmount, installmentAmount,
      totalInstallments, paidInstallments, interestRate,
      startDate, endDate, description, creditor, settlementAmount,
    } = req.body;

    const debt = await prisma.debt.create({
      data: {
        name,
        type,
        totalAmount: Number(totalAmount),
        remainingAmount: Number(remainingAmount ?? totalAmount),
        installmentAmount: Number(installmentAmount),
        totalInstallments: Number(totalInstallments),
        paidInstallments: Number(paidInstallments ?? 0),
        interestRate: Number(interestRate ?? 0),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description || null,
        creditor: creditor || null,
        settlementAmount: settlementAmount != null && settlementAmount !== '' ? Number(settlementAmount) : null,
        userId,
      },
    });
    res.status(201).json(debt);
  } catch (error) {
    console.error('Error creating debt:', error);
    res.status(500).json({ error: 'Failed to create debt' });
  }
});

// PUT /api/debts/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string)
    const id = req.params.id as string;
    const existing = await prisma.debt.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Debt not found' });

    const {
      name, type, totalAmount, remainingAmount, installmentAmount,
      totalInstallments, paidInstallments, interestRate,
      startDate, endDate, description, creditor, settlementAmount,
    } = req.body;

    const debt = await prisma.debt.update({
      where: { id },
      data: {
        name,
        type,
        totalAmount: Number(totalAmount),
        remainingAmount: Number(remainingAmount),
        installmentAmount: Number(installmentAmount),
        totalInstallments: Number(totalInstallments),
        paidInstallments: Number(paidInstallments),
        interestRate: Number(interestRate ?? 0),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description || null,
        creditor: creditor || null,
        settlementAmount: settlementAmount != null && settlementAmount !== '' ? Number(settlementAmount) : null,
      },
    });
    res.json(debt);
  } catch (error) {
    console.error('Error updating debt:', error);
    res.status(500).json({ error: 'Failed to update debt' });
  }
});

// POST /api/debts/:id/settle
router.post('/:id/settle', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string)
    const id = req.params.id as string
    const existing = await prisma.debt.findFirst({ where: { id, userId } })
    if (!existing) return res.status(404).json({ error: 'Debt not found' })

    const { settledAt, paymentIds } = req.body
    if (!settledAt) return res.status(400).json({ error: 'settledAt is required' })

    const settledAtDate = new Date(settledAt)

    // Mark debt as settled
    const debt = await prisma.debt.update({
      where: { id },
      data: {
        status: 'settled',
        settledAt: settledAtDate,
        remainingAmount: 0,
      } as any,
    })

    console.log(`[settle] Debt "${existing.name}" (id=${id}) settled at ${settledAt}`)
    console.log(`[settle] paymentIds received from frontend:`, paymentIds)

    // If the frontend sent specific payment IDs, use those; otherwise fall back to name matching
    let targetPayments: any[] = []

    if (Array.isArray(paymentIds) && paymentIds.length > 0) {
      targetPayments = await prisma.payment.findMany({
        where: { id: { in: paymentIds }, userId },
      })
    } else {
      // Fallback: find by name (case-insensitive)
      const normalise = (s: string) => s.trim().toLowerCase()
      const allUserPayments = await prisma.payment.findMany({ where: { userId } })
      targetPayments = allUserPayments.filter(
        p => normalise(p.name) === normalise(existing.name)
      )
    }

    console.log(`[settle] Found ${targetPayments.length} payments to process:`,
      targetPayments.map(p => ({ id: p.id, name: p.name, isRecurring: p.isRecurring, dueDate: p.dueDate, status: p.status }))
    )

    const nonRecurring = targetPayments.filter(p => !p.isRecurring)
    const recurring = targetPayments.filter(p => p.isRecurring)

    // Delete future pending/overdue non-recurring payments
    for (const p of nonRecurring) {
      if (['pending', 'overdue'].includes(p.status) && new Date(p.dueDate) >= settledAtDate) {
        console.log(`[settle] Deleting non-recurring payment id=${p.id} name="${p.name}" dueDate=${p.dueDate}`)
        await prisma.payment.delete({ where: { id: p.id } })
      }
    }

    // For recurring payments: truncate recurrenceEndDate so calendar stops generating future occurrences
    for (const p of recurring) {
      if (new Date(p.dueDate) >= settledAtDate) {
        console.log(`[settle] Deleting recurring payment id=${p.id} name="${p.name}" dueDate=${p.dueDate}`)
        await prisma.payment.delete({ where: { id: p.id } })
      } else {
        // Truncate recurrenceEndDate to the day before settledAt
        const cutoff = new Date(settledAtDate)
        cutoff.setDate(cutoff.getDate() - 1)
        console.log(`[settle] Truncating recurring payment id=${p.id} name="${p.name}" recurrenceEndDate -> ${cutoff.toISOString()}`)
        await prisma.payment.update({
          where: { id: p.id },
          data: { recurrenceEndDate: cutoff },
        })
      }
    }

    res.json(debt)
  } catch (error) {
    console.error('Error settling debt:', error)
    res.status(500).json({ error: 'Failed to settle debt' })
  }
})

// DELETE /api/debts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string)
    const id = req.params.id as string;
    const existing = await prisma.debt.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Debt not found' });
    await prisma.debt.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete debt' });
  }
});

export default router;
