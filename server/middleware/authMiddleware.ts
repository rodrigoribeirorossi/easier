import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Debug: log when middleware runs
  try {
    console.log('[AUTH] authMiddleware invoked for', req.method, req.originalUrl)
    console.log('[AUTH] Authorization header:', req.headers.authorization)
    console.log('[AUTH] Cookie header:', req.headers.cookie)
  } catch (e) {
    // ignore logging errors
  }

  const authHeader = req.headers.authorization as string | undefined
  if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' })

  const parts = authHeader.split(' ')
  const token = parts.length === 2 ? parts[1] : undefined
  if (!token) return res.status(401).json({ error: 'Token missing' })

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    if (payload && payload.userId) {
      ;(req.headers as any)['x-user-id'] = payload.userId
      next()
      return
    }
    return res.status(401).json({ error: 'Invalid token payload' })
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
