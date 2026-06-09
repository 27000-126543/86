import { Router } from 'express';
import { db } from '../data/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, DashboardStats, AlertItem } from '../../shared/types';

const router = Router();

router.get('/stats', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  let stats = db.getDashboardStats();
  
  if (user.roleLevel === 1 && user.storeId) {
    const store = db.getStores().find(s => s.id === user.storeId);
    if (store) {
      const storeRevenue = store.dailyTarget * (0.9 + Math.random() * 0.2);
      stats = {
        ...stats,
        totalRevenue: Math.round(storeRevenue),
        activeStores: 1,
        totalStores: 1,
        regionalRevenue: [{ region: store.name, revenue: Math.round(storeRevenue), target: store.dailyTarget }],
      };
    }
  } else if (user.roleLevel === 2 && user.storeId) {
    const store = db.getStores().find(s => s.id === user.storeId);
    if (store) {
      const storeRevenue = store.dailyTarget * (0.9 + Math.random() * 0.2);
      stats = {
        ...stats,
        totalRevenue: Math.round(storeRevenue),
        activeStores: 1,
        totalStores: 1,
        regionalRevenue: [{ region: store.name, revenue: Math.round(storeRevenue), target: store.dailyTarget }],
      };
    }
  } else if (user.roleLevel === 3 && user.regionId) {
    const stores = db.getStoresByRegion(user.regionId);
    const regionRevenue = stores.reduce((sum, s) => sum + s.dailyTarget * (0.9 + Math.random() * 0.2), 0);
    stats = {
      ...stats,
      totalRevenue: Math.round(regionRevenue),
      activeStores: stores.filter(s => s.status === 'open').length,
      totalStores: stores.length,
      regionalRevenue: stores.map(s => ({
        region: s.name,
        revenue: Math.round(s.dailyTarget * (0.9 + Math.random() * 0.2)),
        target: s.dailyTarget,
      })),
    };
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: stats
  } as ApiResponse<DashboardStats>);
});

router.get('/alerts', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  let alerts = db.getAlerts();
  
  if (user.roleLevel <= 2 && user.storeId) {
    const store = db.getStores().find(s => s.id === user.storeId);
    if (store) {
      alerts = alerts.filter(a => a.storeName === store.name);
    }
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: alerts
  } as ApiResponse<AlertItem[]>);
});

router.get('/stores', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  let stores = db.getStores();
  
  if (user.roleLevel <= 2 && user.storeId) {
    stores = stores.filter(s => s.id === user.storeId);
  } else if (user.roleLevel === 3 && user.regionId) {
    stores = db.getStoresByRegion(user.regionId);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: stores
  } as ApiResponse<typeof stores>);
});

router.get('/regions', authMiddleware, (req: AuthRequest, res) => {
  const regions = db.getRegions();
  res.json({
    code: 200,
    message: 'success',
    data: regions
  } as ApiResponse<typeof regions>);
});

export default router;
