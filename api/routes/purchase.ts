import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, PurchaseOrder, PurchaseStatus, ApprovalRecord } from '../../shared/types';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const user = req.user!;
  const { storeId, status } = req.query;
  
  let orders = db.getPurchaseOrders();
  
  if (user.roleLevel <= 2 && user.storeId) {
    orders = orders.filter(o => o.storeId === user.storeId);
  } else if (storeId) {
    orders = orders.filter(o => o.storeId === storeId);
  }
  
  if (status) {
    orders = orders.filter(o => o.status === status);
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
  } as ApiResponse<{ list: PurchaseOrder[]; total: number; page: number; pageSize: number }>);
});

router.get('/:id', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const order = db.getPurchaseOrderById(id);
  
  if (!order) {
    return res.json({ code: 404, message: '采购单不存在', data: null } as ApiResponse<null>);
  }
  
  const user = req.user!;
  if (user.roleLevel <= 2 && user.storeId !== order.storeId) {
    return res.json({ code: 403, message: '无权限查看其他门店数据', data: null } as ApiResponse<null>);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: order
  } as ApiResponse<PurchaseOrder>);
});

router.post('/', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { items, forecastId } = req.body;
  const user = req.user!;
  const storeId = user.storeId;
  
  if (!storeId) {
    return res.json({ code: 400, message: '请先关联门店', data: null } as ApiResponse<null>);
  }
  
  const store = db.getStores().find(s => s.id === storeId);
  if (!store) {
    return res.json({ code: 404, message: '门店不存在', data: null } as ApiResponse<null>);
  }
  
  const totalAmount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  
  const rules = db.getApprovalRules().find(r => r.processType === 'purchase');
  let status: PurchaseStatus = 'pending';
  let currentApprover = store.managerName || '店长';
  let currentApproverId = store.managerId;
  
  if (rules) {
    if (totalAmount > rules.level3Threshold) {
      status = 'pending';
      currentApprover = '总经理';
    } else if (totalAmount > rules.level2Threshold) {
      status = 'pending';
      currentApprover = '区域经理';
    }
  }
  
  const newOrder: PurchaseOrder = {
    id: uuidv4(),
    orderNo: `PO${dayjs().format('YYYYMM')}${String(db.getPurchaseOrders().length + 1).padStart(4, '0')}`,
    storeId,
    storeName: store.name,
    forecastId,
    items,
    totalAmount,
    status,
    currentApprover: currentApproverId,
    currentApproverName: currentApprover,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    approvalHistory: [],
  };
  
  db.addPurchaseOrder(newOrder);
  
  res.json({
    code: 200,
    message: '采购单创建成功',
    data: newOrder
  } as ApiResponse<PurchaseOrder>);
});

router.post('/:id/approve', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const user = req.user!;
  
  const order = db.getPurchaseOrderById(id);
  if (!order) {
    return res.json({ code: 404, message: '采购单不存在', data: null } as ApiResponse<null>);
  }
  
  if (user.roleLevel <= 2 && user.storeId !== order.storeId && order.status !== 'escalated') {
    return res.json({ code: 403, message: '无权限审批其他门店采购单', data: null } as ApiResponse<null>);
  }
  
  const rules = db.getApprovalRules().find(r => r.processType === 'purchase');
  let newStatus: PurchaseStatus = order.status;
  let newApprover: string | undefined;
  let newApproverName: string | undefined;
  
  const approvalRecord: ApprovalRecord = {
    id: uuidv4(),
    approverId: user.id,
    approverName: user.name,
    role: user.role,
    action: 'approve',
    comment: comment || '',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
  
  if (order.status === 'pending' || order.status === 'escalated') {
    if (user.roleLevel === 2 || order.totalAmount <= (rules?.level1Threshold || 5000)) {
      newStatus = 'approved_store';
      newApprover = 'u003';
      newApproverName = '王强';
    }
  } else if (order.status === 'approved_store') {
    if (user.roleLevel === 3 || order.totalAmount <= (rules?.level2Threshold || 20000)) {
      newStatus = 'approved_region';
      if (order.totalAmount > (rules?.level2Threshold || 20000)) {
        newApprover = 'u001';
        newApproverName = '系统管理员';
      }
    }
  } else if (order.status === 'approved_region') {
    if (user.roleLevel >= 4) {
      newStatus = 'approved_general';
    }
  }
  
  if (newStatus === 'approved_general') {
    newStatus = 'completed';
    newApprover = undefined;
    newApproverName = undefined;
  }
  
  const updated = db.updatePurchaseOrder(id, {
    status: newStatus,
    currentApprover: newApprover,
    currentApproverName: newApproverName,
    approvalHistory: [...order.approvalHistory, approvalRecord],
  });
  
  res.json({
    code: 200,
    message: '审批成功',
    data: updated
  } as ApiResponse<PurchaseOrder>);
});

router.post('/:id/reject', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const user = req.user!;
  
  const order = db.getPurchaseOrderById(id);
  if (!order) {
    return res.json({ code: 404, message: '采购单不存在', data: null } as ApiResponse<null>);
  }
  
  const approvalRecord: ApprovalRecord = {
    id: uuidv4(),
    approverId: user.id,
    approverName: user.name,
    role: user.role,
    action: 'reject',
    comment: comment || '拒绝原因未填写',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
  
  const updated = db.updatePurchaseOrder(id, {
    status: 'rejected',
    currentApprover: undefined,
    currentApproverName: undefined,
    approvalHistory: [...order.approvalHistory, approvalRecord],
  });
  
  res.json({
    code: 200,
    message: '已拒绝',
    data: updated
  } as ApiResponse<PurchaseOrder>);
});

export default router;
