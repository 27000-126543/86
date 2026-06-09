import { Router } from 'express';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, DashboardStats, AlertItem } from '../../shared/types';

const router = Router();

router.get('/stats', authMiddleware, (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const regionId = req.query.regionId ? String(req.query.regionId) : '';
    const storeId = req.query.storeId ? String(req.query.storeId) : '';
    const date = req.query.date ? String(req.query.date) : '';
    
    let stats = db.getDashboardStats();
    let targetStores = db.getStores();
    
    if (user.roleLevel <= 2 && user.storeId) {
      targetStores = targetStores.filter(s => s.id === user.storeId);
    } else if (user.roleLevel === 3 && user.regionId) {
      targetStores = db.getStoresByRegion(user.regionId);
    }
    
    if (regionId) {
      targetStores = targetStores.filter(s => s.regionId === regionId);
    }
    
    if (storeId) {
      targetStores = targetStores.filter(s => s.id === storeId);
    }
    
    const dateFactor = date ? 0.85 + Math.random() * 0.3 : 1;
    const totalRevenue = Math.round(targetStores.reduce((sum, s) => sum + s.dailyTarget * (0.9 + Math.random() * 0.2), 0) * dateFactor);
    
    const hourTrend = Array.from({ length: 24 }, (_, i) => {
      const hourFactor = i >= 11 && i <= 14 ? 1.5 : i >= 17 && i <= 21 ? 1.3 : 0.5;
      return {
        hour: String(i) + ':00',
        revenue: Math.round((totalRevenue / 24) * hourFactor * (0.9 + Math.random() * 0.2)),
        orders: Math.floor(((stats.todayOrders || stats.orderCount || 1000) / 24) * hourFactor * (0.9 + Math.random() * 0.2)),
      };
    });
    
    const regionalRevenue = targetStores.map(s => ({
      region: s.name,
      revenue: Math.round(s.dailyTarget * (0.9 + Math.random() * 0.2) * dateFactor),
      target: s.dailyTarget,
    }));
    
    const dishRanking = (stats.dishRanking || stats.topDishes || []).map(d => ({
      ...d,
      name: d.name || d.dishName,
      quantity: Math.round((d.quantity || d.sales || 100) * (0.9 + Math.random() * 0.2)),
      revenue: Math.round((d.revenue || d.sales * 50 || 5000) * (0.9 + Math.random() * 0.2)),
    }));
    
    const result = {
      ...stats,
      totalRevenue,
      todayRevenue: totalRevenue,
      orderCount: Math.floor(stats.orderCount * (targetStores.length / Math.max(stats.totalStores, 1))),
      todayOrders: Math.floor((stats.todayOrders || stats.orderCount) * (targetStores.length / Math.max(stats.totalStores, 1))),
      activeStores: targetStores.filter(s => s.status === 'open').length,
      totalStores: targetStores.length,
      foodSafetyRate: Math.min(100, stats.foodSafetyRate + (Math.random() - 0.5) * 5),
      deliveryOnTimeRate: Math.min(100, (stats.deliveryOnTimeRate || 95) + (Math.random() - 0.5) * 3),
      inTransitCount: Math.floor((stats.inTransitCount || stats.deliveriesInTransit || 20) * (0.8 + Math.random() * 0.4)),
      alertCount: Math.floor((stats.alertCount || stats.alertDeliveries || 5) * (targetStores.length / Math.max(stats.totalStores, 1))),
      hourTrend,
      regionalRevenue,
      dishRanking,
    };
    
    res.json({
      code: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ code: 500, message: String(error), data: null });
  }
});

router.get('/alerts', authMiddleware, (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const regionId = req.query.regionId ? String(req.query.regionId) : '';
    const storeId = req.query.storeId ? String(req.query.storeId) : '';
    let alerts = db.getAlerts();
    
    if (user.roleLevel <= 2 && user.storeId) {
      const store = db.getStores().find(s => s.id === user.storeId);
      if (store) {
        alerts = alerts.filter(a => a.storeName === store.name);
      }
    } else if (user.roleLevel === 3 && user.regionId) {
      const regionStores = db.getStoresByRegion(user.regionId).map(s => s.name);
      alerts = alerts.filter(a => regionStores.includes(a.storeName));
    }
    
    if (regionId) {
      const regionStores = db.getStoresByRegion(regionId).map(s => s.name);
      alerts = alerts.filter(a => regionStores.includes(a.storeName));
    }
    
    if (storeId) {
      const store = db.getStores().find(s => s.id === storeId);
      if (store) {
        alerts = alerts.filter(a => a.storeName === store.name);
      }
    }

    if (date) {
      const targetDate = dayjs(date).format('YYYY-MM-DD');
      alerts = alerts.filter(a => dayjs(a.createdAt).format('YYYY-MM-DD') === targetDate);
    }
    
    res.json({
      code: 200,
      message: 'success',
      data: alerts
    });
  } catch (error) {
    console.error('Dashboard alerts error:', error);
    res.status(500).json({ code: 500, message: String(error), data: null });
  }
});

router.get('/stores', authMiddleware, (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const regionId = req.query.regionId ? String(req.query.regionId) : '';
    let stores = db.getStores();
    
    if (user.roleLevel <= 2 && user.storeId) {
      stores = stores.filter(s => s.id === user.storeId);
    } else if (user.roleLevel === 3 && user.regionId) {
      stores = db.getStoresByRegion(user.regionId);
    }
    
    if (regionId) {
      stores = stores.filter(s => s.regionId === regionId);
    }
    
    const storesWithStats = stores.map(store => ({
      ...store,
      todayRevenue: Math.round(store.dailyTarget * (0.9 + Math.random() * 0.2)),
      orderCount: Math.floor(200 + Math.random() * 100),
      foodSafetyRate: 92 + Math.random() * 8,
      lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }));
    
    res.json({
      code: 200,
      message: 'success',
      data: storesWithStats
    });
  } catch (error) {
    console.error('Dashboard stores error:', error);
    res.status(500).json({ code: 500, message: String(error), data: null });
  }
});

router.get('/regions', authMiddleware, (req: AuthRequest, res) => {
  try {
    const regions = db.getRegions();
    res.json({
      code: 200,
      message: 'success',
      data: regions
    });
  } catch (error) {
    console.error('Dashboard regions error:', error);
    res.status(500).json({ code: 500, message: String(error), data: null });
  }
});

export default router;
