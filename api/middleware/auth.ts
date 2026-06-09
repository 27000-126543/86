import { Request, Response, NextFunction } from 'express';
import { db } from '../data/database';

export interface AuthRequest extends Request {
  user?: ReturnType<typeof db.validateToken>;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未授权访问', data: null });
  }
  
  const token = authHeader.split(' ')[1];
  const user = db.validateToken(token);
  
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Token无效或已过期', data: null });
  }
  
  req.user = user;
  next();
}

export function roleMiddleware(minLevel: number) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未授权访问', data: null });
    }
    
    if (req.user.roleLevel < minLevel) {
      return res.status(403).json({ code: 403, message: '权限不足', data: null });
    }
    
    next();
  };
}
