import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, ForecastItem, PurchaseItem, PurchaseOrder, PurchaseStatus, ApprovalRecord } from '../../shared/types';

const router = Router();

const materialRecipes: Record<string, { materialName: string; specification: string; unit: string; unitPrice: number; quantityPerDish: number }[]> = {
  'd001': [
    { materialName: '五花肉', specification: '五花肉块', unit: 'kg', unitPrice: 35, quantityPerDish: 0.4 },
    { materialName: '冰糖', specification: '单晶冰糖', unit: 'kg', unitPrice: 12, quantityPerDish: 0.03 },
    { materialName: '酱油', specification: '生抽', unit: '瓶', unitPrice: 15, quantityPerDish: 0.02 },
  ],
  'd002': [
    { materialName: '鲈鱼', specification: '鲜活鲈鱼', unit: 'kg', unitPrice: 60, quantityPerDish: 0.6 },
    { materialName: '葱姜', specification: '新鲜葱姜', unit: 'kg', unitPrice: 8, quantityPerDish: 0.05 },
  ],
  'd003': [
    { materialName: '鸡胸肉', specification: '鸡胸肉丁', unit: 'kg', unitPrice: 22, quantityPerDish: 0.25 },
    { materialName: '花生米', specification: '熟花生米', unit: 'kg', unitPrice: 18, quantityPerDish: 0.03 },
  ],
  'd004': [
    { materialName: '西兰花', specification: '新鲜西兰花', unit: 'kg', unitPrice: 12, quantityPerDish: 0.35 },
    { materialName: '大蒜', specification: '大蒜头', unit: 'kg', unitPrice: 10, quantityPerDish: 0.02 },
  ],
  'd005': [
    { materialName: '番茄', specification: '新鲜番茄', unit: 'kg', unitPrice: 6, quantityPerDish: 0.2 },
    { materialName: '鸡蛋', specification: '鸡蛋', unit: '个', unitPrice: 1.5, quantityPerDish: 2 },
  ],
  'd006': [
    { materialName: '米饭', specification: '大米', unit: 'kg', unitPrice: 5, quantityPerDish: 0.15 },
    { materialName: '鸡蛋', specification: '鸡蛋', unit: '个', unitPrice: 1.5, quantityPerDish: 1 },
    { materialName: '火腿', specification: '火腿丁', unit: 'kg', unitPrice: 45, quantityPerDish: 0.05 },
  ],
  'd007': [
    { materialName: '奶茶粉', specification: '奶茶粉', unit: 'kg', unitPrice: 30, quantityPerDish: 0.05 },
    { materialName: '珍珠', specification: '木薯珍珠', unit: 'kg', unitPrice: 20, quantityPerDish: 0.03 },
  ],
  'd008': [
    { materialName: '芒果', specification: '新鲜芒果', unit: 'kg', unitPrice: 25, quantityPerDish: 0.15 },
    { materialName: '牛奶', specification: '鲜牛奶', unit: 'L', unitPrice: 12, quantityPerDish: 0.1 },
  ],
  'd009': [
    { materialName: '牛肉', specification: '牛肉片', unit: 'kg', unitPrice: 70, quantityPerDish: 0.3 },
    { materialName: '豆芽', specification: '黄豆芽', unit: 'kg', unitPrice: 4, quantityPerDish: 0.2 },
  ],
  'd010': [
    { materialName: '草鱼', specification: '鲜活草鱼', unit: 'kg', unitPrice: 35, quantityPerDish: 0.8 },
    { materialName: '酸菜', specification: '四川酸菜', unit: 'kg', unitPrice: 8, quantityPerDish: 0.15 },
  ],
};

function calculatePurchaseItems(forecastItems: ForecastItem[]): PurchaseItem[] {
  const materialMap = new Map<string, PurchaseItem>();

  forecastItems.forEach(forecast => {
    const recipe = materialRecipes[forecast.dishId];
    if (!recipe) return;

    recipe.forEach(mat => {
      const key = `${mat.materialName}_${mat.specification}_${mat.unit}`;
      const quantity = mat.quantityPerDish * forecast.forecastQuantity * 1.1;
      
      if (materialMap.has(key)) {
        const existing = materialMap.get(key)!;
        existing.quantity = Math.round((existing.quantity + quantity) * 100) / 100;
        existing.subtotal = Math.round(existing.quantity * existing.unitPrice * 100) / 100;
      } else {
        const calcQty = Math.round(quantity * 100) / 100;
        materialMap.set(key, {
          id: uuidv4(),
          materialName: mat.materialName,
          specification: mat.specification,
          unit: mat.unit,
          unitPrice: mat.unitPrice,
          quantity: calcQty,
          subtotal: Math.round(calcQty * mat.unitPrice * 100) / 100,
        });
      }
    });
  });

  return Array.from(materialMap.values());
}

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
  
  db.addForecastItems(newForecasts);
  
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
  
  const updated = db.updateForecastItem(id, { forecastQuantity, status: status || item.status });
  
  res.json({
    code: 200,
    message: '更新成功',
    data: updated
  } as ApiResponse<ForecastItem>);
});

router.post('/create-purchase', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { forecastIds, storeId } = req.body;
  const user = req.user!;
  const targetStoreId = user.roleLevel <= 2 ? user.storeId : storeId;
  
  if (!targetStoreId) {
    return res.json({ code: 400, message: '请选择门店', data: null } as ApiResponse<null>);
  }
  
  if (!forecastIds || !Array.isArray(forecastIds) || forecastIds.length === 0) {
    return res.json({ code: 400, message: '请选择至少一条预测记录', data: null } as ApiResponse<null>);
  }
  
  const forecastItems = db.getForecastItems().filter(f => forecastIds.includes(f.id));
  if (forecastItems.length === 0) {
    return res.json({ code: 404, message: '未找到有效的预测记录', data: null } as ApiResponse<null>);
  }
  
  const store = db.getStores().find(s => s.id === targetStoreId);
  if (!store) {
    return res.json({ code: 404, message: '门店不存在', data: null } as ApiResponse<null>);
  }
  
  const items = calculatePurchaseItems(forecastItems);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  const rules = db.getApprovalRules().find(r => r.processType === 'purchase');
  let status: PurchaseStatus = 'pending';
  let currentApprover: string | undefined = store.managerId;
  let currentApproverName: string | undefined = store.managerName;
  
  if (rules) {
    if (totalAmount > rules.level3Threshold) {
      currentApprover = 'u001';
      currentApproverName = '系统管理员';
    } else if (totalAmount > rules.level2Threshold) {
      currentApprover = 'u003';
      currentApproverName = '王强';
    }
  }
  
  const newOrder: PurchaseOrder = {
    id: uuidv4(),
    orderNo: `PO${dayjs().format('YYYYMMDD')}${String(db.getPurchaseOrders().length + 1).padStart(4, '0')}`,
    storeId: targetStoreId,
    storeName: store.name,
    forecastId: forecastItems[0].id,
    items,
    totalAmount: Math.round(totalAmount * 100) / 100,
    status,
    currentApprover,
    currentApproverName,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    approvalHistory: [],
  };
  
  db.addPurchaseOrder(newOrder);
  
  forecastItems.forEach(item => {
    db.updateForecastItem(item.id, { status: 'confirmed' });
  });
  
  res.json({
    code: 200,
    message: '采购单创建成功',
    data: newOrder
  } as ApiResponse<PurchaseOrder>);
});

export default router;
