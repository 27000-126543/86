import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, InspectionRecord, IssueRecord } from '../../shared/types';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const user = req.user!;
  const { storeId, status } = req.query;
  
  let records = db.getInspectionRecords();
  
  if (user.roleLevel <= 2 && user.storeId) {
    records = records.filter(r => r.storeId === user.storeId);
  } else if (storeId) {
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
  } as ApiResponse<{ list: InspectionRecord[]; total: number; page: number; pageSize: number }>);
});

router.post('/checkin', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { storeId } = req.body;
  const user = req.user!;
  
  const targetStoreId = user.roleLevel <= 2 ? user.storeId : storeId;
  if (!targetStoreId) {
    return res.json({ code: 400, message: '请选择门店', data: null } as ApiResponse<null>);
  }
  
  const store = db.getStores().find(s => s.id === targetStoreId);
  if (!store) {
    return res.json({ code: 404, message: '门店不存在', data: null } as ApiResponse<null>);
  }
  
  const newRecord: InspectionRecord = {
    id: uuidv4(),
    inspectorId: user.id,
    inspectorName: user.name,
    storeId: targetStoreId,
    storeName: store.name,
    checkInTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    items: [],
    issues: [],
    status: 'in_progress',
  };
  
  db.addInspectionRecord(newRecord);
  
  res.json({
    code: 200,
    message: '打卡成功',
    data: newRecord
  } as ApiResponse<InspectionRecord>);
});

router.post('/report-issue', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { recordId, description, type, severity, photos } = req.body;
  const user = req.user!;
  
  const record = db.getInspectionRecords().find(r => r.id === recordId);
  if (!record) {
    return res.json({ code: 404, message: '巡检记录不存在', data: null } as ApiResponse<null>);
  }
  
  if (record.inspectorId !== user.id) {
    return res.json({ code: 403, message: '无权修改他人的巡检记录', data: null } as ApiResponse<null>);
  }
  
  const newIssue: IssueRecord = {
    id: uuidv4(),
    description,
    type,
    severity,
    photos: photos || [],
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
  
  const updated = db.updateInspectionRecord(recordId, {
    issues: [...record.issues, newIssue],
    status: 'issue_found',
  });
  
  res.json({
    code: 200,
    message: '问题已上报',
    data: updated
  } as ApiResponse<InspectionRecord>);
});

router.post('/checkout', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { recordId, items } = req.body;
  const user = req.user!;
  
  const record = db.getInspectionRecords().find(r => r.id === recordId);
  if (!record) {
    return res.json({ code: 404, message: '巡检记录不存在', data: null } as ApiResponse<null>);
  }
  
  if (record.inspectorId !== user.id) {
    return res.json({ code: 403, message: '无权修改他人的巡检记录', data: null } as ApiResponse<null>);
  }
  
  const inspectionItems = items.map((item: any) => ({
    id: uuidv4(),
    name: item.name,
    category: item.category,
    result: item.result,
    remark: item.remark,
    photoUrl: item.photoUrl,
  }));
  
  const hasIssues = record.issues.length > 0;
  const status = hasIssues ? 'issue_found' : 'completed';
  
  const updated = db.updateInspectionRecord(recordId, {
    items: inspectionItems,
    checkOutTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    status,
  });
  
  res.json({
    code: 200,
    message: '巡检完成',
    data: updated
  } as ApiResponse<InspectionRecord>);
});

export default router;
