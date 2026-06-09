import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, User, ApprovalRule, RoleLevel, UserRole } from '../../shared/types';

const router = Router();

router.get('/users', authMiddleware, roleMiddleware(5), (req: AuthRequest, res) => {
  const { role, keyword } = req.query;
  
  let users = db.getUsers();
  
  if (role) {
    users = users.filter(u => u.role === role);
  }
  
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    users = users.filter(u => 
      u.name.toLowerCase().includes(kw) || 
      u.username.toLowerCase().includes(kw)
    );
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: users,
      total: users.length,
      page: 1,
      pageSize: users.length
    }
  } as ApiResponse<{ list: User[]; total: number; page: number; pageSize: number }>);
});

router.post('/users', authMiddleware, roleMiddleware(5), (req: AuthRequest, res) => {
  const { username, name, role, roleLevel, storeId, regionId, phone } = req.body;
  
  if (!username || !name || !role || !roleLevel) {
    return res.json({ code: 400, message: '缺少必要参数', data: null } as ApiResponse<null>);
  }
  
  const existingUser = db.getUserByUsername(username);
  if (existingUser) {
    return res.json({ code: 400, message: '用户名已存在', data: null } as ApiResponse<null>);
  }
  
  const newUser: User = {
    id: uuidv4(),
    username,
    name,
    phone: phone || '',
    role: role as UserRole,
    roleLevel: roleLevel as RoleLevel,
    storeId,
    regionId,
  };
  
  db.addUser(newUser);
  
  res.json({
    code: 200,
    message: '用户创建成功',
    data: newUser
  } as ApiResponse<User>);
});

router.put('/users/:id', authMiddleware, roleMiddleware(5), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, role, roleLevel, storeId, regionId, status } = req.body;
  
  const user = db.getUserById(id);
  if (!user) {
    return res.json({ code: 404, message: '用户不存在', data: null } as ApiResponse<null>);
  }
  
  const updated = db.updateUser(id, {
    name,
    role: role as UserRole,
    roleLevel: roleLevel as RoleLevel,
    storeId,
    regionId,
  });
  
  res.json({
    code: 200,
    message: '用户更新成功',
    data: updated
  } as ApiResponse<User>);
});

router.get('/approval-rules', authMiddleware, roleMiddleware(5), (req: AuthRequest, res) => {
  const rules = db.getApprovalRules();
  
  res.json({
    code: 200,
    message: 'success',
    data: rules
  } as ApiResponse<ApprovalRule[]>);
});

router.put('/approval-rules', authMiddleware, roleMiddleware(5), (req: AuthRequest, res) => {
  const { processType, level1Threshold, level2Threshold, level3Threshold, escalationHours } = req.body;
  
  const rules = db.getApprovalRules();
  const rule = rules.find(r => r.processType === processType);
  
  if (!rule) {
    return res.json({ code: 404, message: '审批规则不存在', data: null } as ApiResponse<null>);
  }
  
  const updated = db.updateApprovalRule(rule.id, {
    level1Threshold,
    level2Threshold,
    level3Threshold,
    escalationHours,
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  });
  
  res.json({
    code: 200,
    message: '审批规则更新成功',
    data: updated
  } as ApiResponse<ApprovalRule>);
});

export default router;
