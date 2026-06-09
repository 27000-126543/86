export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type UserRole = 'staff' | 'manager' | 'regional' | 'finance' | 'general';
export type RoleLevel = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string;
  username: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  roleLevel: RoleLevel;
  level?: RoleLevel;
  storeId?: string;
  regionId?: string;
  department?: string;
  avatar?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Region {
  id: string;
  name: string;
  managerId?: string;
  managerName?: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  regionId: string;
  regionName?: string;
  managerId?: string;
  managerName?: string;
  phone: string;
  status: 'open' | 'closed' | 'maintenance';
  dailyTarget: number;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  ingredients: string[];
  shelfLife: number;
}

export interface ForecastItem {
  id: string;
  storeId: string;
  storeName: string;
  dishId: string;
  dishName: string;
  forecastDate: string;
  forecastQuantity: number;
  historicalData: number[];
  weatherFactor: number;
  confidence: number;
  status: 'draft' | 'confirmed' | 'adjusted';
}

export type PurchaseStatus = 'pending' | 'approved_store' | 'approved_region' | 'approved_general' | 'rejected' | 'completed' | 'escalated';

export interface PurchaseItem {
  id: string;
  materialName: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface ApprovalRecord {
  id?: string;
  level?: number;
  status?: string;
  approverId?: string;
  approverName?: string;
  role?: string;
  action?: 'approve' | 'reject' | 'escalate' | 'pending';
  comment?: string;
  createdAt?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNo: string;
  storeId: string;
  storeName: string;
  forecastId?: string;
  items: PurchaseItem[];
  totalAmount: number;
  status: PurchaseStatus;
  currentApprover?: string;
  currentApproverName?: string;
  createdAt: string;
  escalatedAt?: string;
  approvalHistory: ApprovalRecord[];
}

export interface ProductionItem {
  id: string;
  dishId: string;
  dishName: string;
  plannedQuantity: number;
  actualQuantity: number;
  startTime?: string;
  endTime?: string;
  status: 'pending' | 'processing' | 'completed';
}

export interface ProductionPlan {
  id: string;
  planNo: string;
  kitchenId: string;
  kitchenName: string;
  date: string;
  items: ProductionItem[];
  status: 'scheduled' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  location: string;
  status: 'normal' | 'warning' | 'fault' | 'maintenance';
  lastMaintenance: string;
  nextMaintenance: string;
}

export type MaintenanceStatus = 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'escalated';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface MaintenanceWorkOrder {
  id: string;
  orderNo: string;
  equipmentId: string;
  equipmentName: string;
  faultDescription: string;
  reporterId: string;
  reporterName: string;
  assigneeId?: string;
  assigneeName?: string;
  status: MaintenanceStatus;
  priority: PriorityLevel;
  createdAt: string;
  escalatedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
}

export type DeliveryStatus = 'scheduled' | 'loading' | 'in_transit' | 'arrived' | 'delayed' | 'alert';

export interface DeliveryItem {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
}

export interface TemperatureRecord {
  timestamp: string;
  temperature: number;
  location: string;
}

export interface RoutePoint {
  timestamp: string;
  lat: number;
  lng: number;
  address: string;
}

export interface DeliveryOrder {
  id: string;
  orderNo: string;
  storeId: string;
  storeName: string;
  vehicleId: string;
  driverName: string;
  items: DeliveryItem[];
  temperatureLog: TemperatureRecord[];
  status: DeliveryStatus;
  currentTemperature: number;
  targetTemperature: { min: number; max: number };
  estimatedArrival: string;
  actualArrival?: string;
  route: RoutePoint[];
}

export type InspectionStatus = 'in_progress' | 'completed' | 'issue_found';
export type InspectionResult = 'pass' | 'fail' | 'warning';
export type IssueType = 'expired' | 'deteriorated' | 'hygiene' | 'temperature' | 'other';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface InspectionItem {
  id: string;
  name: string;
  category: string;
  result: InspectionResult;
  remark?: string;
  photoUrl?: string;
}

export interface IssueRecord {
  id: string;
  description: string;
  type: IssueType;
  severity: IssueSeverity;
  photos: string[];
  workOrderId?: string;
  createdAt: string;
}

export interface InspectionRecord {
  id: string;
  inspectorId: string;
  inspectorName: string;
  storeId: string;
  storeName: string;
  checkInTime: string;
  checkOutTime?: string;
  items: InspectionItem[];
  issues: IssueRecord[];
  status: InspectionStatus;
}

export type RecallStatus = 'pending' | 'pending_approval' | 'approved_store' | 'approved_region' | 'executing' | 'completed';
export type RecallType = 'withdraw' | 'remove' | 'recall';
export type NodeType = 'supplier' | 'warehouse' | 'kitchen' | 'store';
export type TraceStatus = 'pending' | 'in_transit' | 'delivered' | 'returned' | 'affected' | 'cleared';

export interface TraceabilityNode {
  id: string;
  nodeType: NodeType;
  type?: NodeType;
  name: string;
  status?: TraceStatus;
  timestamp?: string;
  location?: string;
  inTime: string;
  outTime?: string;
  operator: string;
  quantity?: number;
  batchNo?: string;
  expiryDate?: string;
  remark?: string;
}

export interface RecallWorkOrder {
  id: string;
  orderNo: string;
  issueId: string;
  type: RecallType;
  productName: string;
  batchNo: string;
  productBatch?: string;
  affectedQuantity?: number;
  reason?: string;
  affectedStores: string[];
  supplierId: string;
  supplierName: string;
  status: RecallStatus;
  approvalHistory: ApprovalRecord[];
  traceability: TraceabilityNode[];
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  qualification: string;
}

export type MemberLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type CouponType = 'discount' | 'amount' | 'gift';
export type CouponStatus = 'unused' | 'used' | 'expired';

export interface Coupon {
  id: string;
  name: string;
  type: CouponType;
  value: number;
  condition: number;
  minAmount?: number;
  discountAmount?: number;
  expireDate: string;
  status: CouponStatus;
}

export interface ConsumptionRecord {
  id: string;
  date: string;
  storeId: string;
  storeName: string;
  amount: number;
  dishes: string[];
  pointsEarned: number;
}

export interface MemberLevelHistory {
  id: string;
  fromLevel: MemberLevel;
  toLevel: MemberLevel;
  action: 'upgrade' | 'downgrade';
  reason: string;
  effectiveDate: string;
  operator: string;
}

export interface Member {
  id: string;
  memberNo: string;
  cardNumber?: string;
  name: string;
  phone: string;
  level: MemberLevel;
  points: number;
  totalSpent: number;
  visitCount: number;
  joinDate?: string;
  lastVisit: string;
  tastePreferences: string[];
  preferences?: string[];
  tags?: string[];
  coupons: Coupon[];
  consumptionHistory: ConsumptionRecord[];
  levelHistory?: MemberLevelHistory[];
}

export type ReconciliationStatus = 'matched' | 'mismatch' | 'discrepancy' | 'investigating' | 'resolved';

export interface DailyTransaction {
  id: string;
  date: string;
  storeId: string;
  storeName: string;
  totalRevenue: number;
  cashRevenue: number;
  digitalRevenue: number;
  memberRevenue: number;
  cost: number;
  profit: number;
  orderCount: number;
  avgOrderAmount: number;
  status?: ReconciliationStatus;
  revenueBreakdown?: { category: string; amount: number }[];
  costBreakdown?: { category: string; amount: number }[];
}

export interface ReconciliationRecord {
  id: string;
  date: string;
  storeId: string;
  storeName?: string;
  transactionId?: string;
  expectedAmount?: number;
  actualAmount?: number;
  difference?: number;
  systemAmount?: number;
  bankAmount?: number;
  variance?: number;
  status: ReconciliationStatus;
  remark?: string;
  investigation?: {
    reason: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    startedAt: string;
    status: string;
  };
  createdAt?: string;
}

export type AlertType = 'food_safety' | 'temperature' | 'equipment' | 'approval' | 'reconciliation';

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  severity: IssueSeverity;
  storeName: string;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  orderCount: number;
  orderGrowth: number;
  foodSafetyRate: number;
  activeStores: number;
  totalStores: number;
  deliveriesInTransit: number;
  alertDeliveries: number;
  topDishes: { name: string; sales: number; trend?: number; growth?: number; dishName?: string; category?: string; quantity?: number; revenue?: number; revenueShare?: number }[];
  recentAlerts: AlertItem[];
  hourlyRevenue: { hour: string; revenue: number }[];
  regionalRevenue: { region: string; revenue: number; target: number }[];
  todayOrders?: number;
  todayRevenue?: number;
  dishRanking?: { name: string; sales: number; growth: number; trend?: number; dishName?: string; category?: string; quantity?: number; revenue?: number; revenueShare?: number }[];
  deliveryOnTimeRate?: number;
  inTransitCount?: number;
  alertCount?: number;
  hourTrend?: { hour: string; revenue: number; orders: number }[];
}

export interface ApprovalRule {
  id: string;
  processType: string;
  type?: string;
  name?: string;
  minAmount?: number;
  maxAmount?: number;
  levels?: number[];
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
  escalationHours: number;
  description?: string;
  enabled?: boolean;
  updatedAt: string;
}

export interface CostDetailItem {
  category: string;
  actual: number;
  budget: number;
  variance: number;
  variancePercent: number;
  itemName?: string;
  budgetAmount?: number;
  actualAmount?: number;
  varianceRate?: number;
}

export interface MonthlyOperationReport {
  period: string;
  totalRevenue: number;
  revenueGrowth: number;
  totalCost: number;
  costGrowth?: number;
  totalProfit: number;
  netProfit?: number;
  profitMargin: number;
  grossMargin?: number;
  netMargin?: number;
  profitGrowth?: number;
  orderCount: number;
  orderGrowth?: number;
  avgOrderAmount: number;
  avgOrderValue?: number;
  memberCount: number;
  newMemberCount: number;
  memberSpending?: number;
  memberSpendingRatio?: number;
  foodSafetyRate: number;
  onTimeDeliveryRate: number;
  costRatio?: number;
  topStores: { name: string; revenue: number }[];
  bottomStores: { name: string; revenue: number }[];
  storeRanking?: { name: string; revenue: number; growth: number }[];
  dishRanking: { name: string; sales: number; growth: number; trend?: number; dishName?: string; category?: string; quantity?: number; revenue?: number; revenueShare?: number }[];
  costDetails: CostDetailItem[];
  targetRevenue?: number;
  revenueGrowthYoy?: number;
  regionalRevenue?: { region: string; revenue: number; growth: number; target?: number }[];
  foodSafetyIssues?: number;
  rectificationRate?: number;
  storePerformance?: { name: string; revenue: number; growth: number; safetyRate: number; storeName?: string; issues?: number; foodSafetyRate?: number }[];
  deliveryTotal?: number;
  deliveryOnTime?: number;
  deliveryOnTimeRate?: number;
  deliveryExceptions?: number;
}

export interface CostControlReport {
  period: string;
  totalCost: number;
  budgetCost: number;
  costVariance: number;
  costVariancePercent: number;
  foodCost: number;
  laborCost: number;
  operationCost: number;
  otherCost: number;
  ingredientCost?: number;
  ingredientRatio?: number;
  laborRatio?: number;
  operationRatio?: number;
  otherRatio?: number;
  costDetails?: CostDetailItem[];
  details: CostDetailItem[];
  topCostItems: { name: string; amount: number; percent: number }[];
  costSavingSuggestions?: { category: string; saving: number; suggestion: string }[];
  recommendations: { category: string; saving: number; suggestion: string }[];
}
