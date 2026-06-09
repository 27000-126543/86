import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, RecallWorkOrder, TraceabilityNode, ApprovalRecord } from '../../shared/types';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { status, type } = req.query;
  
  let orders = db.getRecallOrders();
  
  if (status) {
    orders = orders.filter(o => o.status === status);
  }
  
  if (type) {
    orders = orders.filter(o => o.type === type);
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
  } as ApiResponse<{ list: RecallWorkOrder[]; total: number; page: number; pageSize: number }>);
});

router.post('/', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { issueId, type, productName, batchNo, affectedStores, supplierId, supplierName } = req.body;
  const user = req.user!;
  
  const supplier = db.getSuppliers().find(s => s.id === supplierId);
  if (!supplier) {
    return res.json({ code: 404, message: '供应商不存在', data: null } as ApiResponse<null>);
  }
  
  const traceability: TraceabilityNode[] = [
    {
      id: uuidv4(),
      nodeType: 'supplier',
      name: supplier.name,
      inTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD 08:00:00'),
      outTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD 10:00:00'),
      operator: supplier.contact,
    },
    {
      id: uuidv4(),
      nodeType: 'warehouse',
      name: '中心仓储-1号库',
      inTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD 14:00:00'),
      outTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD 06:00:00'),
      operator: '库管员',
    },
    {
      id: uuidv4(),
      nodeType: 'kitchen',
      name: '中央厨房1号',
      inTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD 08:00:00'),
      outTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD 18:00:00'),
      operator: '厨师长',
    },
    ...affectedStores.map((storeId: string) => {
      const store = db.getStores().find(s => s.id === storeId);
      return {
        id: uuidv4(),
        nodeType: 'store' as const,
        name: store?.name || storeId,
        inTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD 08:00:00'),
        operator: store?.managerName || '店长',
      };
    }),
  ];
  
  const newOrder: RecallWorkOrder = {
    id: uuidv4(),
    orderNo: `RC${dayjs().format('YYYYMMDD')}${String(db.getRecallOrders().length + 1).padStart(4, '0')}`,
    issueId,
    type,
    productName,
    batchNo,
    affectedStores,
    supplierId,
    supplierName: supplier.name,
    status: 'pending_approval',
    approvalHistory: [],
    traceability,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
  
  db.addRecallOrder(newOrder);
  
  res.json({
    code: 200,
    message: '工单创建成功',
    data: newOrder
  } as ApiResponse<RecallWorkOrder>);
});

router.post('/:id/approve', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { comment, action } = req.body;
  const user = req.user!;
  
  const order = db.getRecallOrderById(id);
  if (!order) {
    return res.json({ code: 404, message: '工单不存在', data: null } as ApiResponse<null>);
  }
  
  const approvalRecord: ApprovalRecord = {
    id: uuidv4(),
    approverId: user.id,
    approverName: user.name,
    role: user.role,
    action: action || 'approve',
    comment: comment || '',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
  
  let newStatus = order.status;
  if (action === 'reject') {
    newStatus = 'pending_approval';
  } else {
    if (order.status === 'pending_approval') {
      newStatus = 'approved_store';
    } else if (order.status === 'approved_store') {
      newStatus = 'approved_region';
    } else if (order.status === 'approved_region') {
      newStatus = 'executing';
    }
  }
  
  const updated = db.updateRecallOrder(id, {
    status: newStatus,
    approvalHistory: [...order.approvalHistory, approvalRecord],
  });
  
  res.json({
    code: 200,
    message: '审批成功',
    data: updated
  } as ApiResponse<RecallWorkOrder>);
});

router.get('/:id/traceability', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const order = db.getRecallOrderById(id);
  if (!order) {
    return res.json({ code: 404, message: '工单不存在', data: null } as ApiResponse<null>);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: order.traceability
  } as ApiResponse<TraceabilityNode[]>);
});

export default router;
