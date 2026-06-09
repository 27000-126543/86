import { Router } from 'express';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, DailyTransaction, ReconciliationRecord, CostDetailItem } from '../../shared/types';

const router = Router();

router.get('/transactions', authMiddleware, roleMiddleware(4), (req: AuthRequest, res) => {
  const { storeId, date, startDate, endDate, status } = req.query;
  
  const transactions = db.getDailyTransactions({
    storeId: storeId as string,
    date: date as string,
    status: status as string,
    startDate: startDate as string,
    endDate: endDate as string
  });
  
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

router.get('/transactions/:id', authMiddleware, roleMiddleware(4), (req: AuthRequest, res) => {
  const { id } = req.params;
  const transaction = db.getDailyTransactionById(id);
  
  if (!transaction) {
    return res.json({ code: 404, message: '流水记录不存在', data: null } as ApiResponse<null>);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: transaction
  } as ApiResponse<DailyTransaction>);
});

router.get('/reconciliation', authMiddleware, roleMiddleware(4), (req: AuthRequest, res) => {
  const { storeId, status, startDate, endDate } = req.query;
  
  const records = db.getReconciliationRecords({
    storeId: storeId as string,
    status: status as string,
    startDate: startDate as string,
    endDate: endDate as string
  });
  
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

router.get('/reconciliation/:id', authMiddleware, roleMiddleware(4), (req: AuthRequest, res) => {
  const { id } = req.params;
  const record = db.getReconciliationRecordById(id);
  
  if (!record) {
    return res.json({ code: 404, message: '对账记录不存在', data: null } as ApiResponse<null>);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: record
  } as ApiResponse<ReconciliationRecord>);
});

router.post('/reconciliation/:id/investigate', authMiddleware, roleMiddleware(4), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason, priority } = req.body;
  
  if (!reason) {
    return res.json({ code: 400, message: '请填写核查原因', data: null } as ApiResponse<null>);
  }
  
  const result = db.startInvestigation(id, reason, priority || 'normal');
  
  if (!result) {
    return res.json({ code: 404, message: '记录不存在', data: null } as ApiResponse<null>);
  }
  
  res.json({
    code: 200,
    message: '已触发对账核查',
    data: result
  } as ApiResponse<ReconciliationRecord>);
});

router.get('/reconciliation/:id/transaction', authMiddleware, roleMiddleware(4), (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const record = db.getReconciliationRecordById(id);
  if (!record) {
    return res.json({ code: 404, message: '对账记录不存在', data: null } as ApiResponse<null>);
  }
  
  if (!record.transactionId) {
    return res.json({ code: 404, message: '未关联流水记录', data: null } as ApiResponse<null>);
  }
  
  const transaction = db.getDailyTransactionById(record.transactionId);
  if (!transaction) {
    return res.json({ code: 404, message: '流水记录不存在', data: null } as ApiResponse<null>);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: transaction
  } as ApiResponse<DailyTransaction>);
});

router.get('/transactions/:id/reconciliation', authMiddleware, roleMiddleware(4), (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const records = db.getReconciliationRecords().filter(r => r.transactionId === id);
  
  res.json({
    code: 200,
    message: 'success',
    data: records
  } as ApiResponse<ReconciliationRecord[]>);
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
