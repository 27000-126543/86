import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, MaintenanceWorkOrder, Equipment, PriorityLevel } from '../../shared/types';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { status, priority } = req.query;
  
  let orders = db.getMaintenanceOrders();
  
  if (status) {
    orders = orders.filter(o => o.status === status);
  }
  
  if (priority) {
    orders = orders.filter(o => o.priority === priority);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: orders,
      total: orders.length,
      page: 1,
      pageSize: orders.length
    }
  } as ApiResponse<{ list: MaintenanceWorkOrder[]; total: number; page: number; pageSize: number }>);
});

router.get('/equipment', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { status } = req.query;
  
  let equipments = db.getEquipments();
  
  if (status) {
    equipments = equipments.filter(e => e.status === status);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: equipments
  } as ApiResponse<Equipment[]>);
});

router.post('/', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { equipmentId, faultDescription, priority } = req.body;
  const user = req.user!;
  
  const equipment = db.getEquipments().find(e => e.id === equipmentId);
  if (!equipment) {
    return res.json({ code: 404, message: '设备不存在', data: null } as ApiResponse<null>);
  }
  
  const newOrder: MaintenanceWorkOrder = {
    id: uuidv4(),
    orderNo: `WO${dayjs().format('YYYYMMDD')}${String(db.getMaintenanceOrders().length + 1).padStart(4, '0')}`,
    equipmentId,
    equipmentName: equipment.name,
    faultDescription,
    reporterId: user.id,
    reporterName: user.name,
    status: 'pending',
    priority: (priority as PriorityLevel) || 'medium',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
  
  db.addMaintenanceOrder(newOrder);
  
  res.json({
    code: 200,
    message: '维修工单创建成功',
    data: newOrder
  } as ApiResponse<MaintenanceWorkOrder>);
});

router.post('/:id/assign', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { assigneeId, assigneeName } = req.body;
  
  const order = db.getMaintenanceOrderById(id);
  if (!order) {
    return res.json({ code: 404, message: '工单不存在', data: null } as ApiResponse<null>);
  }
  
  const updated = db.updateMaintenanceOrder(id, {
    assigneeId,
    assigneeName,
    status: 'assigned',
  });
  
  res.json({
    code: 200,
    message: '工单指派成功',
    data: updated
  } as ApiResponse<MaintenanceWorkOrder>);
});

router.post('/:id/accept', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  
  const order = db.getMaintenanceOrderById(id);
  if (!order) {
    return res.json({ code: 404, message: '工单不存在', data: null } as ApiResponse<null>);
  }
  
  if (order.assigneeId && order.assigneeId !== user.id) {
    return res.json({ code: 403, message: '无权承接此工单', data: null } as ApiResponse<null>);
  }
  
  const updated = db.updateMaintenanceOrder(id, {
    status: 'accepted',
    acceptedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  });
  
  res.json({
    code: 200,
    message: '接单成功',
    data: updated
  } as ApiResponse<MaintenanceWorkOrder>);
});

router.post('/:id/complete', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { remark } = req.body;
  const user = req.user!;
  
  const order = db.getMaintenanceOrderById(id);
  if (!order) {
    return res.json({ code: 404, message: '工单不存在', data: null } as ApiResponse<null>);
  }
  
  if (order.assigneeId && order.assigneeId !== user.id) {
    return res.json({ code: 403, message: '无权完成此工单', data: null } as ApiResponse<null>);
  }
  
  const updated = db.updateMaintenanceOrder(id, {
    status: 'completed',
    completedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  });
  
  res.json({
    code: 200,
    message: '工单完成',
    data: updated
  } as ApiResponse<MaintenanceWorkOrder>);
});

export default router;
