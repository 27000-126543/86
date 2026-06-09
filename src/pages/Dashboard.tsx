import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  RefreshCw,
  Download,
  TrendingUp,
  ShoppingCart,
  ShieldCheck,
  Store as StoreIcon,
  Truck,
  AlertTriangle,
  MapPin,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/utils/api';
import { formatCurrency, formatDateTime, formatPercent } from '@/utils/format';
import type { DashboardStats, AlertItem, Region, Store } from '@/../shared/types';

const CHART_COLORS = ['#00D4FF', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7'];

interface FilterState {
  regionId: string;
  storeId: string;
  date: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [regionDropdown, setRegionDropdown] = useState(false);
  const [storeDropdown, setStoreDropdown] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    regionId: '',
    storeId: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/stats', {
        params: filters,
      });
      setStats(response.data.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [filters]);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/alerts', { params: filters, });
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  }, [filters]);

  const fetchRegions = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/regions');
      setRegions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
    }
  }, []);

  const fetchStores = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filters.regionId) {
        params.regionId = filters.regionId;
      }
      const response = await api.get('/dashboard/stores', { params });
      setStores(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  }, [filters.regionId]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchAlerts()]);
    setLoading(false);
  }, [fetchStats, fetchAlerts]);

  const handleRefresh = () => {
    fetchAllData();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/reports/operation', {
        responseType: 'blob',
        params: { period: filters.date.substring(0, 7), format: 'xlsx' },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `运营报告_${filters.date.substring(0, 7)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleRegionChange = (regionId: string) => {
    setFilters((prev) => ({ ...prev, regionId, storeId: '' }));
    setRegionDropdown(false);
  };

  const handleStoreChange = (storeId: string) => {
    setFilters((prev) => ({ ...prev, storeId }));
    setStoreDropdown(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, date: e.target.value }));
  };

  useEffect(() => {
    fetchRegions();
    fetchStores();
  }, [fetchRegions, fetchStores]);

  useEffect(() => {
    fetchStores();
  }, [filters.regionId, fetchStores]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const selectedRegion = useMemo(
    () => regions.find((r) => r.id === filters.regionId),
    [regions, filters.regionId]
  );

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === filters.storeId),
    [stores, filters.storeId]
  );

  const sortedDishes = useMemo(
    () => [...(stats?.dishRanking || stats?.topDishes || [])].sort((a, b) => (b.sales || b.quantity || 0) - (a.sales || a.quantity || 0)),
    [stats?.dishRanking, stats?.topDishes]
  );

  const maxDishSales = useMemo(
    () => Math.max(...sortedDishes.map((d) => (d.sales || d.quantity || 1)), 1),
    [sortedDishes]
  );

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-slate-400">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            运营数据看板
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            最后更新: {formatDateTime(lastUpdate)}
            {loading && (
              <span className="ml-2 inline-flex items-center gap-1 text-cyan-400">
                <RefreshCw size={12} className="animate-spin" />
                刷新中
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setRegionDropdown(!regionDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm hover:bg-slate-800 transition-colors"
            >
              <MapPin size={16} className="text-cyan-400" />
              <span>{selectedRegion?.name || '全部区域'}</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>
            {regionDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => handleRegionChange('')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors"
                >
                  全部区域
                </button>
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleRegionChange(region.id)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors"
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setStoreDropdown(!storeDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm hover:bg-slate-800 transition-colors"
            >
              <StoreIcon size={16} className="text-cyan-400" />
              <span>{selectedStore?.name || '全部门店'}</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>
            {storeDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                <button
                  onClick={() => handleStoreChange('')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors"
                >
                  全部门店
                </button>
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreChange(store.id)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors"
                  >
                    {store.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Calendar size={16} className="text-cyan-400" />
            <input
              type="date"
              value={filters.date}
              onChange={handleDateChange}
              className="bg-transparent border-none outline-none text-sm w-32"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Download size={16} className={exporting ? 'animate-bounce' : ''} />
            导出报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="今日营收"
          value={stats.totalRevenue}
          prefix="¥"
          trend={stats.revenueGrowth}
          icon={<TrendingUp size={24} />}
          colorTheme="cyan"
        />
        <StatCard
          title="订单数量"
          value={stats.orderCount}
          trend={stats.orderGrowth}
          icon={<ShoppingCart size={24} />}
          colorTheme="blue"
        />
        <StatCard
          title="食安达标率"
          value={stats.foodSafetyRate}
          suffix="%"
          decimals={1}
          icon={<ShieldCheck size={24} />}
          colorTheme="green"
        />
        <StatCard
          title="活跃门店"
          value={stats.activeStores}
          suffix={`/${stats.totalStores}`}
          icon={<StoreIcon size={24} />}
          colorTheme="purple"
        />
        <StatCard
          title="在途配送"
          value={stats.inTransitCount || stats.deliveriesInTransit}
          icon={<Truck size={24} />}
          colorTheme="yellow"
        />
        <StatCard
          title="待处理告警"
          value={alerts.filter((a) => a.severity === 'high' || a.severity === 'critical').length}
          icon={<AlertTriangle size={24} />}
          colorTheme="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">24小时营收趋势</h3>
              <p className="text-sm text-slate-500 mt-1">实时营收数据变化</p>
            </div>
            <StatusBadge status="normal" text="实时更新" pulse />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.hourTrend || stats.hourlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="hour"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(value: number) => [formatCurrency(value), '营收']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00D4FF"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">各区域营收对比</h3>
              <p className="text-sm text-slate-500 mt-1">区域营收与目标对比</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-cyan-500" />
                实际营收
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-600" />
                目标营收
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.regionalRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="region"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'revenue' ? '实际营收' : '目标营收',
                  ]}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} animationDuration={1000}>
                  {stats.regionalRevenue.map((_, index) => (
                    <Cell key={`revenue-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
                <Bar dataKey="target" fill="#475569" radius={[4, 4, 0, 0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">菜品销量排行</h3>
              <p className="text-sm text-slate-500 mt-1">今日热销菜品 TOP {sortedDishes.length}</p>
            </div>
            <StatusBadge status="normal" text="实时更新" />
          </div>
          <div className="space-y-4">
            {sortedDishes.map((dish, index) => (
              <div key={dish.name || dish.dishName} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : index === 1
                          ? 'bg-slate-400/20 text-slate-300'
                          : index === 2
                          ? 'bg-amber-600/20 text-amber-500'
                          : 'bg-slate-700/50 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium group-hover:text-cyan-400 transition-colors">
                      {dish.name || dish.dishName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400 font-mono">{(dish.sales || dish.quantity || 0).toLocaleString()} 份</span>
                    <span
                      className={`text-xs font-medium ${
                        (dish.trend || dish.growth || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {(dish.trend || dish.growth || 0) >= 0 ? '↑' : '↓'} {Math.abs(dish.trend || dish.growth || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${((dish.sales || dish.quantity || 0) / maxDishSales) * 100}%`,
                      background: `linear-gradient(90deg, ${CHART_COLORS[index % CHART_COLORS.length]} 0%, ${
                        CHART_COLORS[(index + 1) % CHART_COLORS.length]
                      } 100%)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">实时告警列表</h3>
              <p className="text-sm text-slate-500 mt-1">最新告警信息</p>
            </div>
            {alerts.some((a) => a.severity === 'critical' || a.severity === 'high') && (
              <StatusBadge status="alert" text="有告警" pulse />
            )}
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <ShieldCheck size={48} className="mb-2 opacity-50" />
                <p>暂无告警信息</p>
              </div>
            ) : (
              alerts.slice(0, 8).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500/30 animate-pulse'
                      : alert.severity === 'high'
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : alert.severity === 'medium'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-slate-800/30 border-slate-700/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={alert.severity} size="sm" />
                        <StatusBadge status={alert.type} size="sm" />
                      </div>
                      <p className="font-medium text-sm mb-1">{alert.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{alert.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-600">{alert.storeName}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {formatDateTime(alert.createdAt).split(' ')[1]}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
