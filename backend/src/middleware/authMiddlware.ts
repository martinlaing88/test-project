import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided.' });
    return;
  }

  try {
    const user = verifyToken(token);
    (req as any).user = user;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
}
