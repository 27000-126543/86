import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, DeliveryOrder, TemperatureRecord } from '../../shared/types';

const router = Router();

router.get('/delivery', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const user = req.user!;
  const { storeId, status } = req.query;
  
  let orders = db.getDeliveryOrders();
  
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
  } as ApiResponse<{ list: DeliveryOrder[]; total: number; page: number; pageSize: number }>);
});

router.get('/delivery/:id', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const order = db.getDeliveryOrderById(id);
  
  if (!order) {
    return res.json({ code: 404, message: '配送单不存在', data: null } as ApiResponse<null>);
  }
  
  const user = req.user!;
  if (user.roleLevel <= 2 && user.storeId !== order.storeId) {
    return res.json({ code: 403, message: '无权限查看其他门店数据', data: null } as ApiResponse<null>);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: order
  } as ApiResponse<DeliveryOrder>);
});

router.get('/temperature/:id', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const order = db.getDeliveryOrderById(id);
  
  if (!order) {
    return res.json({ code: 404, message: '配送单不存在', data: null } as ApiResponse<null>);
  }
  
  const user = req.user!;
  if (user.roleLevel <= 2 && user.storeId !== order.storeId) {
    return res.json({ code: 403, message: '无权限查看其他门店数据', data: null } as ApiResponse<null>);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: order.temperatureLog
  } as ApiResponse<TemperatureRecord[]>);
});

router.post('/emergency-replenish', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { storeId, items, reason } = req.body;
  const user = req.user!;
  const targetStoreId = user.roleLevel <= 2 ? user.storeId : storeId;
  
  if (!targetStoreId) {
    return res.json({ code: 400, message: '请选择门店', data: null } as ApiResponse<null>);
  }
  
  const store = db.getStores().find(s => s.id === targetStoreId);
  if (!store) {
    return res.json({ code: 404, message: '门店不存在', data: null } as ApiResponse<null>);
  }
  
  const deliveryItems = items.map((item: any) => ({
    id: uuidv4(),
    materialName: item.materialName,
    quantity: item.quantity,
    unit: item.unit || 'kg',
  }));
  
  const tempMin = 0;
  const tempMax = 4;
  
  const newOrder: DeliveryOrder = {
    id: uuidv4(),
    orderNo: `DL${dayjs().format('YYYYMMDD')}${String(db.getDeliveryOrders().length + 1).padStart(4, '0')}`,
    storeId: targetStoreId,
    storeName: store.name,
    vehicleId: '应急配送',
    driverName: '应急调度',
    items: deliveryItems,
    temperatureLog: [],
    status: 'scheduled',
    currentTemperature: 2,
    targetTemperature: { min: tempMin, max: tempMax },
    estimatedArrival: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    route: [],
  };
  
  res.json({
    code: 200,
    message: '应急补货已触发',
    data: newOrder
  } as ApiResponse<DeliveryOrder>);
});

export default router;
