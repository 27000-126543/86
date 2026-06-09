import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, ForecastItem } from '../../shared/types';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const user = req.user!;
  const { storeId, date } = req.query;
  
  let items = db.getForecastItems();
  
  if (user.roleLevel <= 2 && user.storeId) {
    items = items.filter(i => i.storeId === user.storeId);
  } else if (storeId) {
    items = items.filter(i => i.storeId === storeId);
  }
  
  if (date) {
    items = items.filter(i => i.forecastDate === date);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: items,
      total: items.length,
      page: 1,
      pageSize: items.length
    }
  } as ApiResponse<{ list: ForecastItem[]; total: number; page: number; pageSize: number }>);
});

router.post('/generate', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { storeId, forecastDate } = req.body;
  const user = req.user!;
  const targetStoreId = user.roleLevel <= 2 ? user.storeId : storeId;
  
  if (!targetStoreId) {
    return res.json({ code: 400, message: '请选择门店', data: null } as ApiResponse<null>);
  }
  
  const store = db.getStores().find(s => s.id === targetStoreId);
  if (!store) {
    return res.json({ code: 404, message: '门店不存在', data: null } as ApiResponse<null>);
  }
  
  const dishes = db.getDishes();
  const newForecasts: ForecastItem[] = dishes.slice(0, 6).map(dish => {
    const baseQty = dish.category === '热菜' ? 80 : dish.category === '主食' ? 100 : 50;
    return {
      id: uuidv4(),
      storeId: targetStoreId,
      storeName: store.name,
      dishId: dish.id,
      dishName: dish.name,
      forecastDate: forecastDate || dayjs().add(1, 'day').format('YYYY-MM-DD'),
      forecastQuantity: Math.floor(baseQty * (0.8 + Math.random() * 0.4)),
      historicalData: Array.from({ length: 7 }, () => Math.floor(baseQty * (0.8 + Math.random() * 0.4))),
      weatherFactor: 0.9 + Math.random() * 0.2,
      confidence: 0.75 + Math.random() * 0.2,
      status: 'draft' as const
    };
  });
  
  res.json({
    code: 200,
    message: '预测生成成功',
    data: newForecasts
  } as ApiResponse<ForecastItem[]>);
});

router.put('/:id', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { forecastQuantity, status } = req.body;
  
  const forecasts = db.getForecastItems();
  const item = forecasts.find(f => f.id === id);
  
  if (!item) {
    return res.json({ code: 404, message: '预测记录不存在', data: null } as ApiResponse<null>);
  }
  
  const user = req.user!;
  if (user.roleLevel <= 2 && user.storeId !== item.storeId) {
    return res.json({ code: 403, message: '无权限修改其他门店数据', data: null } as ApiResponse<null>);
  }
  
  const updated = { ...item, forecastQuantity, status: status || item.status };
  
  res.json({
    code: 200,
    message: '更新成功',
    data: updated
  } as ApiResponse<ForecastItem>);
});

export default router;
