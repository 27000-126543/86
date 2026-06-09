import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import * as mockData from './mockData';
import type {
  User, Region, Store, Dish, ForecastItem, PurchaseOrder,
  ProductionPlan, Equipment, MaintenanceWorkOrder, DeliveryOrder,
  InspectionRecord, RecallWorkOrder, Member, DailyTransaction,
  ReconciliationRecord, AlertItem, DashboardStats, ApprovalRule,
  Supplier, MonthlyOperationReport, CostDetailItem
} from '../../shared/types';

class Database {
  private users: User[] = mockData.mockUsers;
  private regions: Region[] = mockData.mockRegions;
  private stores: Store[] = mockData.mockStores;
  private dishes: Dish[] = mockData.mockDishes;
  private suppliers: Supplier[] = mockData.mockSuppliers;
  private equipments: Equipment[] = mockData.mockEquipments;
  private approvalRules: ApprovalRule[] = mockData.mockApprovalRules;
  
  private forecastItems: ForecastItem[] = mockData.generateForecastItems();
  private purchaseOrders: PurchaseOrder[] = mockData.generatePurchaseOrders();
  private productionPlans: ProductionPlan[] = mockData.generateProductionPlans();
  private maintenanceOrders: MaintenanceWorkOrder[] = mockData.generateMaintenanceOrders();
  private deliveryOrders: DeliveryOrder[] = mockData.generateDeliveryOrders();
  private inspectionRecords: InspectionRecord[] = mockData.generateInspectionRecords();
  private recallOrders: RecallWorkOrder[] = mockData.generateRecallOrders();
  private members: Member[] = mockData.generateMembers();
  private dailyTransactions: DailyTransaction[] = mockData.generateDailyTransactions();
  private reconciliationRecords: ReconciliationRecord[] = mockData.generateReconciliationRecords();
  private alerts: AlertItem[] = mockData.generateAlerts();
  private tokens: Map<string, User> = new Map();

  getUsers(): User[] { return this.users; }
  getUserById(id: string): User | undefined { return this.users.find(u => u.id === id); }
  getUserByUsername(username: string): User | undefined { return this.users.find(u => u.username === username); }
  addUser(user: User): void { this.users.push(user); }
  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates };
      return this.users[idx];
    }
    return undefined;
  }
  
  getRegions(): Region[] { return this.regions; }
  getStores(): Store[] { return this.stores; }
  getStoresByRegion(regionId: string): Store[] { return this.stores.filter(s => s.regionId === regionId); }
  getDishes(): Dish[] { return this.dishes; }
  getSuppliers(): Supplier[] { return this.suppliers; }
  getEquipments(): Equipment[] { return this.equipments; }
  
  getForecastItems(storeId?: string): ForecastItem[] {
    return storeId ? this.forecastItems.filter(f => f.storeId === storeId) : this.forecastItems;
  }
  
  getForecastItemById(id: string): ForecastItem | undefined {
    return this.forecastItems.find(f => f.id === id);
  }
  
  addForecastItems(items: ForecastItem[]): void {
    items.forEach(item => {
      const existingIdx = this.forecastItems.findIndex(
        f => f.storeId === item.storeId && f.dishId === item.dishId && f.forecastDate === item.forecastDate
      );
      if (existingIdx !== -1) {
        this.forecastItems[existingIdx] = item;
      } else {
        this.forecastItems.unshift(item);
      }
    });
  }
  
  updateForecastItem(id: string, updates: Partial<ForecastItem>): ForecastItem | undefined {
    const idx = this.forecastItems.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.forecastItems[idx] = { ...this.forecastItems[idx], ...updates };
      return this.forecastItems[idx];
    }
    return undefined;
  }
  
  getPurchaseOrders(storeId?: string, status?: string): PurchaseOrder[] {
    let orders = this.purchaseOrders;
    if (storeId) orders = orders.filter(o => o.storeId === storeId);
    if (status) orders = orders.filter(o => o.status === status);
    return orders;
  }
  
  getPurchaseOrderById(id: string): PurchaseOrder | undefined {
    return this.purchaseOrders.find(o => o.id === id);
  }
  
  addPurchaseOrder(order: PurchaseOrder): void {
    this.purchaseOrders.unshift(order);
  }
  
  updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): PurchaseOrder | undefined {
    const idx = this.purchaseOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.purchaseOrders[idx] = { ...this.purchaseOrders[idx], ...updates };
      return this.purchaseOrders[idx];
    }
    return undefined;
  }
  
  getProductionPlans(): ProductionPlan[] { return this.productionPlans; }
  getProductionPlanById(id: string): ProductionPlan | undefined {
    return this.productionPlans.find(p => p.id === id);
  }
  addProductionPlan(plan: ProductionPlan): void {
    this.productionPlans.unshift(plan);
  }
  updateProductionPlan(id: string, updates: Partial<ProductionPlan>): ProductionPlan | undefined {
    const idx = this.productionPlans.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.productionPlans[idx] = { ...this.productionPlans[idx], ...updates };
      return this.productionPlans[idx];
    }
    return undefined;
  }
  
  getMaintenanceOrders(status?: string): MaintenanceWorkOrder[] {
    return status ? this.maintenanceOrders.filter(o => o.status === status) : this.maintenanceOrders;
  }
  
  getMaintenanceOrderById(id: string): MaintenanceWorkOrder | undefined {
    return this.maintenanceOrders.find(o => o.id === id);
  }
  
  addMaintenanceOrder(order: MaintenanceWorkOrder): void {
    this.maintenanceOrders.unshift(order);
  }
  
  updateMaintenanceOrder(id: string, updates: Partial<MaintenanceWorkOrder>): MaintenanceWorkOrder | undefined {
    const idx = this.maintenanceOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.maintenanceOrders[idx] = { ...this.maintenanceOrders[idx], ...updates };
      return this.maintenanceOrders[idx];
    }
    return undefined;
  }
  
  getDeliveryOrders(status?: string): DeliveryOrder[] {
    return status ? this.deliveryOrders.filter(o => o.status === status) : this.deliveryOrders;
  }
  
  getDeliveryOrderById(id: string): DeliveryOrder | undefined {
    return this.deliveryOrders.find(o => o.id === id);
  }
  
  updateDeliveryOrder(id: string, updates: Partial<DeliveryOrder>): DeliveryOrder | undefined {
    const idx = this.deliveryOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.deliveryOrders[idx] = { ...this.deliveryOrders[idx], ...updates };
      return this.deliveryOrders[idx];
    }
    return undefined;
  }
  
  addTemperatureRecord(orderId: string, record: { timestamp: string; temperature: number; location: string }): void {
    const order = this.deliveryOrders.find(o => o.id === orderId);
    if (order) {
      order.temperatureLog.push(record);
      order.currentTemperature = record.temperature;
      if (record.temperature < order.targetTemperature.min || record.temperature > order.targetTemperature.max) {
        order.status = 'alert';
      }
    }
  }
  
  getInspectionRecords(storeId?: string): InspectionRecord[] {
    return storeId ? this.inspectionRecords.filter(r => r.storeId === storeId) : this.inspectionRecords;
  }
  
  addInspectionRecord(record: InspectionRecord): void {
    this.inspectionRecords.unshift(record);
  }
  
  updateInspectionRecord(id: string, updates: Partial<InspectionRecord>): InspectionRecord | undefined {
    const idx = this.inspectionRecords.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.inspectionRecords[idx] = { ...this.inspectionRecords[idx], ...updates };
      return this.inspectionRecords[idx];
    }
    return undefined;
  }
  
  getRecallOrders(): RecallWorkOrder[] { return this.recallOrders; }
  getRecallOrderById(id: string): RecallWorkOrder | undefined {
    return this.recallOrders.find(o => o.id === id);
  }
  
  addRecallOrder(order: RecallWorkOrder): void {
    this.recallOrders.unshift(order);
  }
  
  updateRecallOrder(id: string, updates: Partial<RecallWorkOrder>): RecallWorkOrder | undefined {
    const idx = this.recallOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.recallOrders[idx] = { ...this.recallOrders[idx], ...updates };
      return this.recallOrders[idx];
    }
    return undefined;
  }
  
  getMembers(): Member[] { return this.members; }
  getMemberById(id: string): Member | undefined { return this.members.find(m => m.id === id); }
  updateMember(id: string, updates: Partial<Member>): Member | undefined {
    const idx = this.members.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.members[idx] = { ...this.members[idx], ...updates };
      return this.members[idx];
    }
    return undefined;
  }
  
  getDailyTransactions(params?: { storeId?: string; date?: string; status?: string; startDate?: string; endDate?: string }): DailyTransaction[] {
    let result = this.dailyTransactions;
    if (params?.storeId) result = result.filter(t => t.storeId === params.storeId);
    if (params?.date) result = result.filter(t => t.date === params.date);
    if (params?.status) result = result.filter(t => t.status === params.status);
    if (params?.startDate) result = result.filter(t => t.date >= params.startDate);
    if (params?.endDate) result = result.filter(t => t.date <= params.endDate);
    return result;
  }
  
  getDailyTransactionById(id: string): DailyTransaction | undefined {
    return this.dailyTransactions.find(t => t.id === id);
  }
  
  getReconciliationRecords(params?: { storeId?: string; status?: string; startDate?: string; endDate?: string }): ReconciliationRecord[] {
    let result = this.reconciliationRecords;
    if (params?.storeId) result = result.filter(r => r.storeId === params.storeId);
    if (params?.status) result = result.filter(r => r.status === params.status);
    if (params?.startDate) result = result.filter(r => r.date >= params.startDate);
    if (params?.endDate) result = result.filter(r => r.date <= params.endDate);
    return result;
  }
  
  getReconciliationRecordById(id: string): ReconciliationRecord | undefined {
    return this.reconciliationRecords.find(r => r.id === id);
  }
  
  updateDailyTransaction(id: string, updates: Partial<DailyTransaction>): DailyTransaction | undefined {
    const idx = this.dailyTransactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.dailyTransactions[idx] = { ...this.dailyTransactions[idx], ...updates };
      return this.dailyTransactions[idx];
    }
    return undefined;
  }
  
  startInvestigation(recordId: string, reason: string, priority: 'low' | 'normal' | 'high' | 'urgent'): ReconciliationRecord | undefined {
    const reconciliation = this.reconciliationRecords.find(r => r.id === recordId);
    if (reconciliation) {
      reconciliation.status = 'investigating';
      reconciliation.investigation = {
        reason,
        priority,
        startedAt: new Date().toISOString(),
        status: 'in_progress'
      };
      if (reconciliation.transactionId) {
        const transaction = this.dailyTransactions.find(t => t.id === reconciliation.transactionId);
        if (transaction) {
          transaction.status = 'investigating';
        }
      }
      return reconciliation;
    }
    const transaction = this.dailyTransactions.find(t => t.id === recordId);
    if (transaction) {
      transaction.status = 'investigating';
      const newRecord: ReconciliationRecord = {
        id: uuidv4(),
        storeId: transaction.storeId,
        date: transaction.date,
        systemAmount: transaction.totalRevenue,
        bankAmount: transaction.totalRevenue * (0.97 + Math.random() * 0.05),
        variance: 0,
        status: 'investigating',
        transactionId: transaction.id,
        investigation: {
          reason,
          priority,
          startedAt: new Date().toISOString(),
          status: 'in_progress'
        },
        createdAt: new Date().toISOString()
      };
      this.reconciliationRecords.unshift(newRecord);
      return newRecord;
    }
    return undefined;
  }
  
  updateReconciliationRecord(id: string, updates: Partial<ReconciliationRecord>): ReconciliationRecord | undefined {
    const idx = this.reconciliationRecords.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.reconciliationRecords[idx] = { ...this.reconciliationRecords[idx], ...updates };
      return this.reconciliationRecords[idx];
    }
    return undefined;
  }
  
  getAlerts(): AlertItem[] { return this.alerts; }
  addAlert(alert: AlertItem): void { this.alerts.unshift(alert); }
  
  getApprovalRules(): ApprovalRule[] { return this.approvalRules; }
  updateApprovalRule(id: string, updates: Partial<ApprovalRule>): ApprovalRule | undefined {
    const idx = this.approvalRules.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.approvalRules[idx] = { ...this.approvalRules[idx], ...updates };
      return this.approvalRules[idx];
    }
    return undefined;
  }
  
  getDashboardStats(): DashboardStats { return mockData.generateDashboardStats(); }
  getMonthlyReport(period: string): MonthlyOperationReport { return mockData.generateMonthlyReport(period); }
  getCostDetails(): CostDetailItem[] {
    const report = mockData.generateMonthlyReport(dayjs().format('YYYY-MM'));
    return report.costDetails;
  }
  getCostControlDetails(): CostDetailItem[] {
    const report = mockData.generateMonthlyReport(dayjs().format('YYYY-MM'));
    return report.costDetails;
  }
  
  refreshData(): void {
    this.forecastItems = mockData.generateForecastItems();
    this.purchaseOrders = mockData.generatePurchaseOrders();
    this.productionPlans = mockData.generateProductionPlans();
    this.deliveryOrders = mockData.generateDeliveryOrders();
    this.alerts = mockData.generateAlerts();
  }
  
  refreshRealtimeData(): void {
    this.deliveryOrders = mockData.generateDeliveryOrders();
    this.alerts = mockData.generateAlerts();
    
    this.dailyTransactions.forEach(t => {
      t.totalRevenue += Math.floor(Math.random() * 500);
      t.orderCount += Math.floor(Math.random() * 10);
    });
  }
  
  createToken(user: User): string {
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    this.tokens.set(token, user);
    return token;
  }
  
  validateToken(token: string): User | undefined {
    return this.tokens.get(token);
  }
  
  invalidateToken(token: string): void {
    this.tokens.delete(token);
  }
}

export const db = new Database();
