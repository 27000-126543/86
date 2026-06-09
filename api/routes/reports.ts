import { Router } from 'express';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, MonthlyOperationReport, CostDetailItem } from '../../shared/types';

const router = Router();

router.get('/operation', authMiddleware, roleMiddleware(3), (req: AuthRequest, res) => {
  const { period } = req.query;
  
  const targetPeriod = period || dayjs().format('YYYY-MM');
  const report = db.getMonthlyReport(String(targetPeriod));
  
  res.json({
    code: 200,
    message: 'success',
    data: report
  } as ApiResponse<MonthlyOperationReport>);
});

router.get('/cost-control', authMiddleware, roleMiddleware(3), (req: AuthRequest, res) => {
  const costDetails = db.getCostControlDetails();
  
  res.json({
    code: 200,
    message: 'success',
    data: costDetails
  } as ApiResponse<CostDetailItem[]>);
});

export default router;
