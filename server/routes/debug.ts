import { Router, Request, Response } from 'express'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  try {
    res.json({ headers: req.headers })
  } catch (e) {
    res.status(500).json({ error: 'failed to read headers' })
  }
})

export default router
