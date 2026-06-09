import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import type {
  User, Region, Store, Dish, ForecastItem, PurchaseOrder,
  ProductionPlan, Equipment, MaintenanceWorkOrder, DeliveryOrder,
  InspectionRecord, RecallWorkOrder, Member, DailyTransaction,
  ReconciliationRecord, AlertItem, DashboardStats, ApprovalRule,
  Supplier, Coupon, ConsumptionRecord, ApprovalRecord, MonthlyOperationReport
} from '../../shared/types';

const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals = 2) => Number((Math.random() * (max - min) + min).toFixed(decimals));

export const mockUsers: User[] = [
  { id: 'u001', username: 'admin', name: '系统管理员', phone: '13800000001', role: 'general', roleLevel: 5 },
  { id: 'u002', username: 'finance01', name: '财务主管-李静', phone: '13800000002', role: 'finance', roleLevel: 4 },
  { id: 'u003', username: 'region01', name: '华东区域经理-王强', phone: '13800000003', role: 'regional', roleLevel: 3, regionId: 'r001' },
  { id: 'u004', username: 'manager01', name: '南京路店店长-张伟', phone: '13800000004', role: 'manager', roleLevel: 2, storeId: 's001', regionId: 'r001' },
  { id: 'u005', username: 'manager02', name: '陆家嘴店店长-刘芳', phone: '13800000005', role: 'manager', roleLevel: 2, storeId: 's002', regionId: 'r001' },
  { id: 'u006', username: 'manager03', name: '徐汇店店长-陈明', phone: '13800000006', role: 'manager', roleLevel: 2, storeId: 's003', regionId: 'r001' },
  { id: 'u007', username: 'staff01', name: '店员-赵小雪', phone: '13800000007', role: 'staff', roleLevel: 1, storeId: 's001', regionId: 'r001' },
  { id: 'u008', username: 'inspector01', name: '食安巡检员-孙磊', phone: '13800000008', role: 'manager', roleLevel: 2, regionId: 'r001' },
  { id: 'u009', username: 'maintenance01', name: '维修工程师-周涛', phone: '13800000009', role: 'manager', roleLevel: 2 },
  { id: 'u010', username: 'logistics01', name: '物流调度员-吴杰', phone: '13800000010', role: 'manager', roleLevel: 2 },
];

export const mockRegions: Region[] = [
  { id: 'r001', name: '华东区', managerId: 'u003', managerName: '王强' },
  { id: 'r002', name: '华北区', managerId: undefined, managerName: undefined },
  { id: 'r003', name: '华南区', managerId: undefined, managerName: undefined },
  { id: 'r004', name: '西南区', managerId: undefined, managerName: undefined },
  { id: 'r005', name: '华中区', managerId: undefined, managerName: undefined },
];

export const mockStores: Store[] = [
  { id: 's001', name: '上海南京路店', address: '上海市黄浦区南京路100号', regionId: 'r001', regionName: '华东区', managerId: 'u004', managerName: '张伟', phone: '021-88888888', status: 'open', dailyTarget: 50000 },
  { id: 's002', name: '上海陆家嘴店', address: '上海市浦东新区陆家嘴环路500号', regionId: 'r001', regionName: '华东区', managerId: 'u005', managerName: '刘芳', phone: '021-88888889', status: 'open', dailyTarget: 45000 },
  { id: 's003', name: '上海徐汇店', address: '上海市徐汇区衡山路200号', regionId: 'r001', regionName: '华东区', managerId: 'u006', managerName: '陈明', phone: '021-88888890', status: 'open', dailyTarget: 40000 },
  { id: 's004', name: '北京王府井店', address: '北京市东城区王府井大街300号', regionId: 'r002', regionName: '华北区', managerId: undefined, managerName: undefined, phone: '010-88888888', status: 'open', dailyTarget: 55000 },
  { id: 's005', name: '广州天河店', address: '广州市天河区天河路400号', regionId: 'r003', regionName: '华南区', managerId: undefined, managerName: undefined, phone: '020-88888888', status: 'open', dailyTarget: 48000 },
];

export const mockDishes: Dish[] = [
  { id: 'd001', name: '招牌红烧肉', category: '热菜', price: 68, cost: 25, ingredients: ['五花肉', '冰糖', '酱油', '料酒'], shelfLife: 24 },
  { id: 'd002', name: '清蒸鲈鱼', category: '热菜', price: 128, cost: 55, ingredients: ['鲈鱼', '葱姜', '蒸鱼豉油'], shelfLife: 12 },
  { id: 'd003', name: '宫保鸡丁', category: '热菜', price: 48, cost: 18, ingredients: ['鸡胸肉', '花生米', '干辣椒'], shelfLife: 24 },
  { id: 'd004', name: '蒜蓉西兰花', category: '素菜', price: 28, cost: 10, ingredients: ['西兰花', '大蒜'], shelfLife: 18 },
  { id: 'd005', name: '番茄蛋汤', category: '汤品', price: 18, cost: 6, ingredients: ['番茄', '鸡蛋'], shelfLife: 6 },
  { id: 'd006', name: '扬州炒饭', category: '主食', price: 32, cost: 12, ingredients: ['米饭', '鸡蛋', '火腿', '青豆'], shelfLife: 12 },
  { id: 'd007', name: '珍珠奶茶', category: '饮品', price: 22, cost: 8, ingredients: ['奶茶', '珍珠'], shelfLife: 4 },
  { id: 'd008', name: '芒果布丁', category: '甜品', price: 26, cost: 10, ingredients: ['芒果', '牛奶', '糖'], shelfLife: 24 },
  { id: 'd009', name: '水煮牛肉', category: '热菜', price: 78, cost: 32, ingredients: ['牛肉', '豆芽', '辣椒'], shelfLife: 24 },
  { id: 'd010', name: '酸菜鱼', category: '热菜', price: 98, cost: 38, ingredients: ['草鱼', '酸菜', '辣椒'], shelfLife: 12 },
];

export const mockSuppliers: Supplier[] = [
  { id: 'sup001', name: '上海鲜达食品有限公司', contact: '王经理', phone: '13800138001', address: '上海市嘉定区食品工业园A区', qualification: '食品经营许可证-SP2023001' },
  { id: 'sup002', name: '江南水产养殖合作社', contact: '李场长', phone: '13800138002', address: '江苏省苏州市昆山水产养殖基地', qualification: '水产养殖证-SC2023001' },
  { id: 'sup003', name: '绿野蔬菜配送中心', contact: '张主管', phone: '13800138003', address: '上海市浦东新区蔬菜基地', qualification: '绿色食品认证-LS2023001' },
];

export const mockEquipments: Equipment[] = [
  { id: 'e001', name: '燃气炒锅', model: 'ZCF-500', location: '中央厨房-热厨区', status: 'normal', lastMaintenance: '2026-05-01', nextMaintenance: '2026-07-01' },
  { id: 'e002', name: '蒸箱', model: 'ZX-800', location: '中央厨房-蒸制区', status: 'warning', lastMaintenance: '2026-04-15', nextMaintenance: '2026-06-15' },
  { id: 'e003', name: '冷藏库', model: 'LCK-20', location: '中央厨房-仓储区', status: 'normal', lastMaintenance: '2026-05-10', nextMaintenance: '2026-07-10' },
  { id: 'e004', name: '切菜机', model: 'QCJ-300', location: '中央厨房-预处理区', status: 'fault', lastMaintenance: '2026-03-20', nextMaintenance: '2026-05-20' },
  { id: 'e005', name: '包装机', model: 'BZJ-150', location: '中央厨房-包装区', status: 'normal', lastMaintenance: '2026-05-05', nextMaintenance: '2026-07-05' },
  { id: 'e006', name: '和面机', model: 'HMJ-100', location: '中央厨房-面点区', status: 'normal', lastMaintenance: '2026-05-08', nextMaintenance: '2026-07-08' },
  { id: 'e007', name: '烤箱', model: 'KX-600', location: '中央厨房-烘焙区', status: 'maintenance', lastMaintenance: '2026-02-28', nextMaintenance: '2026-04-28' },
];

export const mockApprovalRules: ApprovalRule[] = [
  { id: '1', processType: 'purchase', level1Threshold: 5000, level2Threshold: 20000, level3Threshold: 50000, escalationHours: 48, updatedAt: '2026-06-01 00:00:00' },
  { id: '2', processType: 'recall', level1Threshold: 0, level2Threshold: 0, level3Threshold: 0, escalationHours: 24, updatedAt: '2026-06-01 00:00:00' },
];

function generateHistoricalData(baseValue: number, days = 7): number[] {
  return Array.from({ length: days }, () => Math.floor(baseValue * (0.8 + Math.random() * 0.4)));
}

function generateTemperatureLog(targetMin: number, targetMax: number, hours = 6): { timestamp: string; temperature: number; location: string }[] {
  const log: { timestamp: string; temperature: number; location: string }[] = [];
  const now = dayjs();
  for (let i = hours; i >= 0; i--) {
    const hasAnomaly = Math.random() < 0.15;
    const temp = hasAnomaly 
      ? randomFloat(targetMin - 3, targetMax + 3) 
      : randomFloat(targetMin, targetMax);
    log.push({
      timestamp: now.subtract(i, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      temperature: temp,
      location: '行驶中',
    });
  }
  return log;
}

function generateRoutePoints(storeId: string): { timestamp: string; lat: number; lng: number; address: string }[] {
  const baseLat = storeId === 's001' ? 31.2304 : storeId === 's002' ? 31.2397 : 31.1982;
  const baseLng = storeId === 's001' ? 121.4737 : storeId === 's002' ? 121.4998 : 121.4373;
  const points: { timestamp: string; lat: number; lng: number; address: string }[] = [];
  const now = dayjs();
  for (let i = 5; i >= 0; i--) {
    points.push({
      timestamp: now.subtract(i * 20, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      lat: baseLat + (Math.random() - 0.5) * 0.05,
      lng: baseLng + (Math.random() - 0.5) * 0.05,
      address: i === 0 ? '目的地' : '途经点',
    });
  }
  return points;
}

export function generateForecastItems(): ForecastItem[] {
  const items: ForecastItem[] = [];
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  
  mockStores.forEach(store => {
    mockDishes.slice(0, 6).forEach(dish => {
      const baseQty = dish.category === '热菜' ? 80 : dish.category === '主食' ? 100 : 50;
      items.push({
        id: `f_${store.id}_${dish.id}`,
        storeId: store.id,
        storeName: store.name,
        dishId: dish.id,
        dishName: dish.name,
        forecastDate: tomorrow,
        forecastQuantity: Math.floor(baseQty * (0.8 + Math.random() * 0.4)),
        historicalData: generateHistoricalData(baseQty),
        weatherFactor: randomFloat(0.9, 1.1, 2),
        confidence: randomFloat(0.75, 0.95, 2),
        status: Math.random() > 0.3 ? 'confirmed' : 'draft',
      });
    });
  });
  
  return items;
}

export function generatePurchaseOrders(): PurchaseOrder[] {
  const orders: PurchaseOrder[] = [];
  const materials = [
    { name: '五花肉', spec: '500g/份', price: 35, unit: '份' },
    { name: '鲈鱼', spec: '600-700g/条', price: 55, unit: '条' },
    { name: '鸡胸肉', spec: '10kg/箱', price: 180, unit: '箱' },
    { name: '西兰花', spec: '5kg/箱', price: 80, unit: '箱' },
    { name: '大米', spec: '25kg/袋', price: 150, unit: '袋' },
    { name: '鸡蛋', spec: '30枚/盒', price: 36, unit: '盒' },
  ];
  
  const statuses: PurchaseOrder['status'][] = ['pending', 'approved_store', 'approved_region', 'completed', 'escalated'];
  
  for (let i = 0; i < 8; i++) {
    const store = mockStores[i % 3];
    const itemCount = randomBetween(2, 5);
    const items = materials.slice(0, itemCount).map(m => {
      const qty = randomBetween(5, 20);
      return {
        id: uuidv4(),
        materialName: m.name,
        specification: m.spec,
        quantity: qty,
        unit: m.unit,
        unitPrice: m.price,
        subtotal: qty * m.price,
      };
    });
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const status = statuses[i % statuses.length];
    const createdAt = dayjs().subtract(randomBetween(1, 72), 'hour').format('YYYY-MM-DD HH:mm:ss');
    
    const approvalHistory: ApprovalRecord[] = [];
    if (status !== 'pending') {
      approvalHistory.push({
        id: uuidv4(),
        approverId: 'u004',
        approverName: '张伟',
        role: '店长',
        action: 'approve',
        comment: '同意采购',
        createdAt: dayjs(createdAt).add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      });
    }
    if (status === 'approved_region' || status === 'completed') {
      approvalHistory.push({
        id: uuidv4(),
        approverId: 'u003',
        approverName: '王强',
        role: '区域经理',
        action: 'approve',
        comment: '审批通过',
        createdAt: dayjs(createdAt).add(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      });
    }
    
    orders.push({
      id: `po_${i + 1}`,
      orderNo: `PO${dayjs().format('YYYYMM')}${String(i + 1).padStart(4, '0')}`,
      storeId: store.id,
      storeName: store.name,
      items,
      totalAmount: total,
      status,
      currentApprover: status === 'pending' ? '张伟' : status === 'approved_store' ? '王强' : undefined,
      currentApproverName: status === 'pending' ? '张伟' : status === 'approved_store' ? '王强' : undefined,
      createdAt,
      escalatedAt: status === 'escalated' ? dayjs(createdAt).add(49, 'hour').format('YYYY-MM-DD HH:mm:ss') : undefined,
      approvalHistory,
    });
  }
  
  return orders;
}

export function generateProductionPlans(): ProductionPlan[] {
  const plans: ProductionPlan[] = [];
  const today = dayjs().format('YYYY-MM-DD');
  
  for (let i = 0; i < 3; i++) {
    const date = dayjs().add(i - 1, 'day').format('YYYY-MM-DD');
    const items = mockDishes.slice(0, 6).map((dish, idx) => ({
      id: uuidv4(),
      dishId: dish.id,
      dishName: dish.name,
      plannedQuantity: randomBetween(100, 300),
      actualQuantity: idx < 4 ? randomBetween(90, 110) : 0,
      startTime: idx < 4 ? dayjs(date).add(6 + idx, 'hour').format('YYYY-MM-DD HH:mm:ss') : undefined,
      endTime: idx < 4 ? dayjs(date).add(8 + idx, 'hour').format('YYYY-MM-DD HH:mm:ss') : undefined,
      status: (idx < 3 ? 'completed' : idx === 3 ? 'processing' : 'pending') as 'pending' | 'processing' | 'completed',
    }));
    
    const hasProcessing = items.some(it => it.status === 'processing');
    const allDone = items.every(it => it.status === 'completed');
    
    plans.push({
      id: `pp_${i + 1}`,
      planNo: `PL${dayjs().format('YYYYMMDD')}${String(i + 1).padStart(3, '0')}`,
      kitchenId: 'k001',
      kitchenName: '中央厨房1号',
      date,
      items,
      status: allDone ? 'completed' : hasProcessing ? 'in_progress' : 'scheduled',
      createdAt: dayjs(date).subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    });
  }
  
  return plans;
}

export function generateMaintenanceOrders(): MaintenanceWorkOrder[] {
  const orders: MaintenanceWorkOrder[] = [
    {
      id: 'wo_1',
      orderNo: 'WO20260609001',
      equipmentId: 'e004',
      equipmentName: '切菜机',
      faultDescription: '刀片转动异响，无法正常切割蔬菜，疑似电机故障',
      reporterId: 'u004',
      reporterName: '张伟',
      assigneeId: 'u009',
      assigneeName: '周涛',
      status: 'assigned',
      priority: 'high',
      createdAt: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 'wo_2',
      orderNo: 'WO20260609002',
      equipmentId: 'e002',
      equipmentName: '蒸箱',
      faultDescription: '温度上升缓慢，密封胶条老化需要更换',
      reporterId: 'u005',
      reporterName: '刘芳',
      assigneeId: undefined,
      assigneeName: undefined,
      status: 'pending',
      priority: 'medium',
      createdAt: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 'wo_3',
      orderNo: 'WO20260608003',
      equipmentId: 'e007',
      equipmentName: '烤箱',
      faultDescription: '加热管损坏，温度达不到设定值',
      reporterId: 'u006',
      reporterName: '陈明',
      assigneeId: 'u009',
      assigneeName: '周涛',
      status: 'accepted',
      priority: 'urgent',
      createdAt: dayjs().subtract(26, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      escalatedAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      acceptedAt: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 'wo_4',
      orderNo: 'WO20260608001',
      equipmentId: 'e001',
      equipmentName: '燃气炒锅',
      faultDescription: '火力调节旋钮松动，已更换配件',
      reporterId: 'u004',
      reporterName: '张伟',
      assigneeId: 'u009',
      assigneeName: '周涛',
      status: 'completed',
      priority: 'low',
      createdAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
      acceptedAt: dayjs().subtract(3, 'day').add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      completedAt: dayjs().subtract(3, 'day').add(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
  ];
  
  return orders;
}

export function generateDeliveryOrders(): DeliveryOrder[] {
  const orders: DeliveryOrder[] = [];
  const drivers = ['张师傅', '李师傅', '王师傅', '赵师傅'];
  const vehicles = ['沪A·D12345', '沪A·D12346', '沪A·D12347', '沪A·D12348'];
  const materials = [
    { name: '新鲜蔬菜', qty: 200, unit: 'kg' },
    { name: '冷鲜猪肉', qty: 150, unit: 'kg' },
    { name: '水产海鲜', qty: 80, unit: 'kg' },
    { name: '米面粮油', qty: 300, unit: 'kg' },
  ];
  
  for (let i = 0; i < 5; i++) {
    const store = mockStores[i % 3];
    const tempMin = i === 2 ? -18 : i === 1 ? 0 : 4;
    const tempMax = i === 2 ? -12 : i === 1 ? 4 : 8;
    const hasAlert = i === 2;
    
    orders.push({
      id: `do_${i + 1}`,
      orderNo: `DL${dayjs().format('YYYYMMDD')}${String(i + 1).padStart(4, '0')}`,
      storeId: store.id,
      storeName: store.name,
      vehicleId: vehicles[i],
      driverName: drivers[i],
      items: materials.slice(0, 3).map(m => ({
        id: uuidv4(),
        materialName: m.name,
        quantity: m.qty,
        unit: m.unit,
      })),
      temperatureLog: generateTemperatureLog(tempMin, tempMax),
      status: hasAlert ? 'alert' : i === 4 ? 'scheduled' : i === 3 ? 'arrived' : 'in_transit',
      currentTemperature: hasAlert ? -8 : randomFloat(tempMin, tempMax),
      targetTemperature: { min: tempMin, max: tempMax },
      estimatedArrival: dayjs().add(randomBetween(30, 120), 'minute').format('YYYY-MM-DD HH:mm:ss'),
      actualArrival: i === 3 ? dayjs().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
      route: generateRoutePoints(store.id),
    });
  }
  
  return orders;
}

export function generateInspectionRecords(): InspectionRecord[] {
  const checkItems = [
    { name: '食品保质期检查', category: '保质期' },
    { name: '冷藏温度检测', category: '温度' },
    { name: '操作环境卫生', category: '卫生' },
    { name: '从业人员健康证', category: '资质' },
    { name: '餐具消毒记录', category: '消毒' },
    { name: '原材料索证索票', category: '溯源' },
  ];
  
  const records: InspectionRecord[] = [
    {
      id: 'ir_1',
      inspectorId: 'u008',
      inspectorName: '孙磊',
      storeId: 's001',
      storeName: '上海南京路店',
      checkInTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      status: 'in_progress',
      items: checkItems.slice(0, 3).map((item, idx) => ({
        id: uuidv4(),
        name: item.name,
        category: item.category,
        result: idx === 1 ? 'fail' : 'pass',
        remark: idx === 1 ? '冷藏温度5°C，超出标准0-4°C范围' : undefined,
      })),
      issues: [],
    },
    {
      id: 'ir_2',
      inspectorId: 'u008',
      inspectorName: '孙磊',
      storeId: 's002',
      storeName: '上海陆家嘴店',
      checkInTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD 09:00:00'),
      checkOutTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD 11:30:00'),
      status: 'issue_found',
      items: checkItems.map((item, idx) => ({
        id: uuidv4(),
        name: item.name,
        category: item.category,
        result: idx === 0 ? 'fail' : idx === 4 ? 'warning' : 'pass',
        remark: idx === 0 ? '发现3盒五花肉已过期2天' : idx === 4 ? '消毒记录不全，缺少2天记录' : undefined,
      })),
      issues: [
        {
          id: 'issue_1',
          description: '冷柜中发现3盒五花肉生产日期为6月5日，保质期3天，已过期2天',
          type: 'expired',
          severity: 'critical',
          photos: ['photo1.jpg', 'photo2.jpg'],
          createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD 10:15:00'),
        },
      ],
    },
    {
      id: 'ir_3',
      inspectorId: 'u008',
      inspectorName: '孙磊',
      storeId: 's003',
      storeName: '上海徐汇店',
      checkInTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD 14:00:00'),
      checkOutTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD 16:00:00'),
      status: 'completed',
      items: checkItems.map(item => ({
        id: uuidv4(),
        name: item.name,
        category: item.category,
        result: 'pass',
      })),
      issues: [],
    },
  ];
  
  return records;
}

export function generateRecallOrders(): RecallWorkOrder[] {
  const orders: RecallWorkOrder[] = [
    {
      id: 'ro_1',
      orderNo: 'RC20260608001',
      issueId: 'issue_1',
      type: 'recall',
      productName: '冷鲜五花肉',
      batchNo: 'B20260605001',
      affectedStores: ['s001', 's002', 's003'],
      supplierId: 'sup001',
      supplierName: '上海鲜达食品有限公司',
      status: 'approved_region',
      approvalHistory: [
        {
          id: uuidv4(),
          approverId: 'u005',
          approverName: '刘芳',
          role: '店长',
          action: 'approve',
          comment: '情况属实，同意下架召回',
          createdAt: dayjs().subtract(1, 'day').add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        },
      ],
      traceability: [
        {
          id: uuidv4(),
          nodeType: 'supplier',
          name: '上海鲜达食品有限公司',
          inTime: '2026-06-05 08:00:00',
          outTime: '2026-06-05 10:00:00',
          operator: '王经理',
        },
        {
          id: uuidv4(),
          nodeType: 'warehouse',
          name: '中心仓储-1号库',
          inTime: '2026-06-05 14:00:00',
          outTime: '2026-06-05 18:00:00',
          operator: '李库管',
        },
        {
          id: uuidv4(),
          nodeType: 'kitchen',
          name: '中央厨房1号',
          inTime: '2026-06-05 20:00:00',
          outTime: '2026-06-06 06:00:00',
          operator: '张厨师长',
        },
        {
          id: uuidv4(),
          nodeType: 'store',
          name: '上海陆家嘴店',
          inTime: '2026-06-06 08:00:00',
          operator: '刘店长',
        },
      ],
      createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
  ];
  
  return orders;
}

function generateCoupons(): Coupon[] {
  return [
    { id: uuidv4(), name: '新会员专享券', type: 'amount', value: 50, condition: 200, expireDate: dayjs().add(30, 'day').format('YYYY-MM-DD'), status: 'unused' },
    { id: uuidv4(), name: '周末特惠券', type: 'discount', value: 0.85, condition: 100, expireDate: dayjs().add(15, 'day').format('YYYY-MM-DD'), status: 'unused' },
    { id: uuidv4(), name: '生日赠饮券', type: 'gift', value: 1, condition: 0, expireDate: dayjs().add(7, 'day').format('YYYY-MM-DD'), status: 'used' },
  ];
}

function generateConsumptionHistory(): ConsumptionRecord[] {
  const history: ConsumptionRecord[] = [];
  for (let i = 0; i < 10; i++) {
    const dishes = mockDishes.slice(0, randomBetween(2, 4)).map(d => d.name);
    const amount = randomBetween(80, 300);
    history.push({
      id: uuidv4(),
      date: dayjs().subtract(i * 3, 'day').format('YYYY-MM-DD'),
      storeId: mockStores[i % 3].id,
      storeName: mockStores[i % 3].name,
      amount,
      dishes,
      pointsEarned: Math.floor(amount / 10),
    });
  }
  return history;
}

export function generateMembers(): Member[] {
  const levels: Member['level'][] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const tastePrefs = [
    ['川菜', '辣味', '牛肉'],
    ['粤菜', '清淡', '海鲜'],
    ['本帮菜', '甜味', '红烧肉'],
    ['素食', '健康', '时蔬'],
  ];
  
  const names = ['李明', '王芳', '张华', '刘伟', '陈静', '赵磊', '孙丽', '周强', '吴敏', '郑浩'];
  
  return names.map((name, i) => {
    const totalSpent = randomBetween(500, 10000);
    const visitCount = randomBetween(5, 100);
    const levelIdx = Math.min(Math.floor(totalSpent / 2000), 4);
    
    return {
      id: `m_${i + 1}`,
      memberNo: `VIP${String(i + 1).padStart(6, '0')}`,
      name,
      phone: `138${String(randomBetween(10000000, 99999999))}`,
      level: levels[levelIdx],
      points: totalSpent,
      totalSpent,
      visitCount,
      lastVisit: dayjs().subtract(randomBetween(0, 30), 'day').format('YYYY-MM-DD'),
      tastePreferences: tastePrefs[i % tastePrefs.length],
      coupons: generateCoupons(),
      consumptionHistory: generateConsumptionHistory(),
    };
  });
}

export function generateDailyTransactions(): DailyTransaction[] {
  const transactions: DailyTransaction[] = [];
  
  for (let d = 0; d < 7; d++) {
    const date = dayjs().subtract(d, 'day').format('YYYY-MM-DD');
    mockStores.slice(0, 3).forEach(store => {
      const revenue = randomFloat(store.dailyTarget * 0.8, store.dailyTarget * 1.2);
      const orderCount = randomBetween(200, 500);
      const cashRatio = randomFloat(0.15, 0.25);
      const digitalRatio = randomFloat(0.4, 0.5);
      const memberRatio = 1 - cashRatio - digitalRatio;
      const costRatio = randomFloat(0.35, 0.45);
      
      transactions.push({
        id: `dt_${date}_${store.id}`,
        date,
        storeId: store.id,
        storeName: store.name,
        totalRevenue: Math.round(revenue),
        cashRevenue: Math.round(revenue * cashRatio),
        digitalRevenue: Math.round(revenue * digitalRatio),
        memberRevenue: Math.round(revenue * memberRatio),
        cost: Math.round(revenue * costRatio),
        profit: Math.round(revenue * (1 - costRatio)),
        orderCount,
        avgOrderAmount: Number((revenue / orderCount).toFixed(2)),
      });
    });
  }
  
  return transactions;
}

export function generateReconciliationRecords(): ReconciliationRecord[] {
  const records: ReconciliationRecord[] = [];
  
  for (let d = 0; d < 7; d++) {
    const date = dayjs().subtract(d, 'day').format('YYYY-MM-DD');
    mockStores.slice(0, 3).forEach(store => {
      const expected = randomFloat(30000, 60000);
      const hasMismatch = Math.random() < 0.2;
      const actual = hasMismatch ? expected * randomFloat(0.9, 1.1) : expected;
      const diff = actual - expected;
      
      records.push({
        id: `rc_${date}_${store.id}`,
        date,
        storeId: store.id,
        storeName: store.name,
        expectedAmount: Math.round(expected),
        actualAmount: Math.round(actual),
        difference: Math.round(diff),
        status: Math.abs(diff) < 100 ? 'matched' : d < 2 ? 'investigating' : 'mismatch',
        remark: hasMismatch && d >= 2 ? '正在核查中' : undefined,
      });
    });
  }
  
  return records;
}

export function generateAlerts(): AlertItem[] {
  const alerts: AlertItem[] = [
    {
      id: 'a_1',
      type: 'temperature',
      title: '冷链配送超温报警',
      description: '配送车辆沪A·D12347温度异常，当前-8°C，标准-18~-12°C',
      severity: 'critical',
      storeName: '上海徐汇店',
      createdAt: dayjs().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 'a_2',
      type: 'food_safety',
      title: '发现过期食品',
      description: '上海陆家嘴店巡检发现3盒五花肉已过期2天',
      severity: 'critical',
      storeName: '上海陆家嘴店',
      createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD 10:15:00'),
    },
    {
      id: 'a_3',
      type: 'approval',
      title: '采购审批超时',
      description: '采购单PO20260600003已超过48小时未处理，已自动越级',
      severity: 'high',
      storeName: '上海南京路店',
      createdAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 'a_4',
      type: 'equipment',
      title: '维修工单升级',
      description: '烤箱维修工单WO20260608003超过2小时未接单，已升级至设备主管',
      severity: 'high',
      storeName: '中央厨房',
      createdAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 'a_5',
      type: 'reconciliation',
      title: '对账异常',
      description: '上海南京路店昨日对账差异2,580元，请核查',
      severity: 'medium',
      storeName: '上海南京路店',
      createdAt: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
  ];
  
  return alerts;
}

export function generateDashboardStats(): DashboardStats {
  const stores = mockStores.filter(s => s.status === 'open');
  const totalRevenue = stores.reduce((sum, s) => sum + s.dailyTarget * randomFloat(0.9, 1.1), 0);
  
  const hourlyRevenue = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    revenue: i >= 10 && i <= 14 || i >= 17 && i <= 21 
      ? randomFloat(3000, 8000) 
      : randomFloat(500, 2000),
  }));
  
  const regionalRevenue = mockRegions.map(r => ({
    region: r.name,
    revenue: r.id === 'r001' ? randomFloat(500000, 800000) : randomFloat(200000, 500000),
    target: r.id === 'r001' ? 600000 : 350000,
  }));
  
  return {
    totalRevenue: Math.round(totalRevenue),
    revenueGrowth: randomFloat(5, 15),
    orderCount: randomBetween(3000, 5000),
    orderGrowth: randomFloat(3, 10),
    foodSafetyRate: randomFloat(92, 99),
    activeStores: stores.length,
    totalStores: mockStores.length,
    deliveriesInTransit: 3,
    alertDeliveries: 1,
    topDishes: mockDishes.slice(0, 5).map(d => ({
      name: d.name,
      sales: randomBetween(200, 500),
      trend: randomFloat(-10, 20),
    })),
    recentAlerts: generateAlerts(),
    hourlyRevenue,
    regionalRevenue,
  };
}

export function generateMonthlyReport(period: string): MonthlyOperationReport {
  const totalRevenue = randomFloat(8000000, 10000000);
  const totalCost = totalRevenue * randomFloat(0.4, 0.5);
  
  return {
    period,
    totalRevenue: Math.round(totalRevenue),
    revenueGrowth: randomFloat(8, 18),
    totalCost: Math.round(totalCost),
    totalProfit: Math.round(totalRevenue - totalCost),
    profitMargin: randomFloat(35, 45),
    orderCount: randomBetween(80000, 120000),
    avgOrderAmount: randomFloat(75, 95),
    memberCount: randomBetween(5000, 8000),
    newMemberCount: randomBetween(800, 1500),
    foodSafetyRate: randomFloat(95, 99),
    onTimeDeliveryRate: randomFloat(90, 98),
    topStores: mockStores.slice(0, 3).map(s => ({
      name: s.name,
      revenue: s.dailyTarget * 30 * randomFloat(0.9, 1.1),
    })).sort((a, b) => b.revenue - a.revenue),
    bottomStores: mockStores.slice(3, 5).map(s => ({
      name: s.name,
      revenue: s.dailyTarget * 30 * randomFloat(0.7, 0.9),
    })),
    dishRanking: mockDishes.slice(0, 10).map(d => ({
      name: d.name,
      sales: randomBetween(1000, 5000),
      growth: randomFloat(-10, 20),
    })).sort((a, b) => b.sales - a.sales),
    costDetails: [
      { category: '原材料成本', actual: totalCost * 0.6, budget: totalCost * 0.58, variance: totalCost * 0.02, variancePercent: 3.45 },
      { category: '人力成本', actual: totalCost * 0.25, budget: totalCost * 0.25, variance: 0, variancePercent: 0 },
      { category: '租金水电', actual: totalCost * 0.1, budget: totalCost * 0.1, variance: 0, variancePercent: 0 },
      { category: '物流配送', actual: totalCost * 0.05, budget: totalCost * 0.07, variance: -totalCost * 0.02, variancePercent: -28.57 },
    ],
  };
}
