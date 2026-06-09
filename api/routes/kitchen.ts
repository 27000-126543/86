import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, ProductionPlan, ProductionItem } from '../../shared/types';

const router = Router();

router.get('/production', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { date, status } = req.query;
  
  let plans = db.getProductionPlans();
  
  if (date) {
    plans = plans.filter(p => p.date === date);
  }
  
  if (status) {
    plans = plans.filter(p => p.status === status);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: plans,
      total: plans.length,
      page: 1,
      pageSize: plans.length
    }
  } as ApiResponse<{ list: ProductionPlan[]; total: number; page: number; pageSize: number }>);
});

router.post('/production/generate', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { date, kitchenId, kitchenName } = req.body;
  
  const dishes = db.getDishes();
  const items: ProductionItem[] = dishes.slice(0, 8).map((dish, idx) => ({
    id: uuidv4(),
    dishId: dish.id,
    dishName: dish.name,
    plannedQuantity: Math.floor(Math.random() * 200) + 100,
    actualQuantity: 0,
    status: 'pending' as const,
  }));
  
  const newPlan: ProductionPlan = {
    id: uuidv4(),
    planNo: `PL${dayjs().format('YYYYMMDD')}${String(db.getProductionPlans().length + 1).padStart(3, '0')}`,
    kitchenId: kitchenId || 'k001',
    kitchenName: kitchenName || '中央厨房1号',
    date: date || dayjs().add(1, 'day').format('YYYY-MM-DD'),
    items,
    status: 'scheduled',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
  
  db.addProductionPlan(newPlan);
  
  res.json({
    code: 200,
    message: '自动排产成功',
    data: newPlan
  } as ApiResponse<ProductionPlan>);
});

router.put('/production/:id/status', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, itemId, itemStatus } = req.body;
  
  const plan = db.getProductionPlanById(id);
  if (!plan) {
    return res.json({ code: 404, message: '生产计划不存在', data: null } as ApiResponse<null>);
  }
  
  let updatedItems = plan.items;
  if (itemId) {
    updatedItems = plan.items.map(item => {
      if (item.id === itemId) {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        return {
          ...item,
          status: itemStatus || item.status,
          startTime: itemStatus === 'processing' ? now : item.startTime,
          endTime: itemStatus === 'completed' ? now : item.endTime,
          actualQuantity: itemStatus === 'completed' ? item.plannedQuantity : item.actualQuantity,
        };
      }
      return item;
    });
  }
  
  const allCompleted = updatedItems.every(item => item.status === 'completed');
  const hasProcessing = updatedItems.some(item => item.status === 'processing');
  
  const planStatus = status || (allCompleted ? 'completed' : hasProcessing ? 'in_progress' : plan.status);
  
  const updated = db.updateProductionPlan(id, {
    status: planStatus,
    items: updatedItems,
  });
  
  res.json({
    code: 200,
    message: '生产状态更新成功',
    data: updated
  } as ApiResponse<ProductionPlan>);
});

export default router;
