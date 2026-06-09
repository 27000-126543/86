import { Router } from 'express';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, DailyTransaction, ReconciliationRecord, CostDetailItem } from '../../shared/types';

const router = Router();

router.get('/transactions', authMiddleware, roleMiddleware(4), (req: AuthRequest, res) => {
  const { storeId, date } = req.query;
  
  let transactions = db.getDailyTransactions();
  
  if (storeId) {
    transactions = transactions.filter(t => t.storeId === storeId);
  }
  
  if (date) {
    transactions = transactions.filter(t => t.date === date);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: transactions,
      total: transactions.length,
      page: 1,
      pageSize: transactions.length
    }
  } as ApiResponse<{ list: DailyTransaction[]; total: number; page: number; pageSize: number }>);
});

router.get('/reconciliation', authMiddleware, roleMiddleware(4), (req: AuthRequest, res) => {
  const { storeId, status } = req.query;
  
  let records = db.getReconciliationRecords();
  
  if (storeId) {
    records = records.filter(r => r.storeId === storeId);
  }
  
  if (status) {
    records = records.filter(r => r.status === status);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: records,
      total: records.length,
      page: 1,
      pageSize: records.length
    }
  } as ApiResponse<{ list: ReconciliationRecord[]; total: number; page: number; pageSize: number }>);
});

router.post('/reconciliation/:id/investigate', authMiddleware, roleMiddleware(4), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { remark } = req.body;
  
  const record = db.getReconciliationRecords().find(r => r.id === id);
  if (!record) {
    return res.json({ code: 404, message: '对账记录不存在', data: null } as ApiResponse<null>);
  }
  
  const updated = db.updateReconciliationRecord(id, {
    status: 'investigating',
    remark: remark || '正在核查中',
  });
  
  res.json({
    code: 200,
    message: '已触发对账核查',
    data: updated
  } as ApiResponse<ReconciliationRecord>);
});

router.get('/cost-details', authMiddleware, roleMiddleware(4), (req: AuthRequest, res) => {
  const costDetails = db.getCostDetails();
  
  res.json({
    code: 200,
    message: 'success',
    data: costDetails
  } as ApiResponse<CostDetailItem[]>);
});

export default router;
