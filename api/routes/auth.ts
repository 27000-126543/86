import { Router } from 'express';
import { db } from '../data/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, LoginRequest, LoginResponse } from '../../shared/types';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body as LoginRequest;
  
  const user = db.getUserByUsername(username);
  
  if (!user) {
    return res.json({ code: 400, message: '用户名或密码错误', data: null } as ApiResponse<null>);
  }
  
  if (password !== '123456') {
    return res.json({ code: 400, message: '用户名或密码错误', data: null } as ApiResponse<null>);
  }
  
  const token = db.createToken(user);
  
  res.json({
    code: 200,
    message: '登录成功',
    data: { token, user }
  } as ApiResponse<LoginResponse>);
});

router.get('/profile', authMiddleware, (req: AuthRequest, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: req.user
  } as ApiResponse<typeof req.user>);
});

router.post('/logout', authMiddleware, (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    db.invalidateToken(token);
  }
  res.json({ code: 200, message: '退出成功', data: null } as ApiResponse<null>);
});

export default router;
