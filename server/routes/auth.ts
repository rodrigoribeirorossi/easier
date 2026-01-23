import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = Router()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })

    const existing = await prisma.user.findUnique({ where: { email: String(email) } })

    // If user already exists but has no passwordHash (legacy email-only user),
    // upgrade the user by setting a password and returning a token.
    if (existing) {
      if (!existing.passwordHash) {
        const passwordHash = await bcrypt.hash(String(password), 10)
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        })
        const token = jwt.sign({ userId: updated.id }, JWT_SECRET, { expiresIn: '7d' })
        return res.status(200).json({ user: updated, token })
      }

      return res.status(400).json({ error: 'User with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(String(password), 10)

    const user = await prisma.user.create({
      data: {
        name: name ? String(name) : String(email).split('@')[0],
        email: String(email),
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({ user, token })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Failed to register' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })

    const user = await prisma.user.findUnique({ where: { email: String(email) } })
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(String(password), user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    res.json({ user: safeUser, token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Failed to login' })
  }
})

export default router
