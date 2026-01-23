import { Request, Response, NextFunction } from 'express'

export default function attachUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers['x-user-id'] as string | undefined
    if (header) {
      // ensure query has userId for routes expecting it
      if (!req.query.userId) {
        // @ts-ignore assign to query
        req.query.userId = header
      }
      // ensure body has userId for create endpoints
      if (req.method !== 'GET') {
        // @ts-ignore
        if (!req.body) req.body = {}
        // @ts-ignore
        if (!req.body.userId) req.body.userId = header
      }
    }
  } catch (e) {
    // ignore
  }
  next()
}
