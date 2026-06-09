import { useState, useEffect } from 'react';
import { BarChart3, Download, Eye, X, AlertCircle, FileText, Calendar, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart } from 'lucide-react';
import { Loading } from '@/components/Loading';
import { api } from '@/utils/api';
import { formatCurrency, formatNumber, formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { MonthlyOperationReport, CostControlReport, ApiResponse } from '@/../shared/types';

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'operation' | 'cost'>('operation');
  const [operationData, setOperationData] = useState<MonthlyOperationReport | null>(null);
  const [costData, setCostData] = useState<CostControlReport | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [filters, setFilters] = useState({
    month: '',
    year: new Date().getFullYear().toString(),
    storeId: '',
  });

  const fetchOperationReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.storeId) params.storeId = filters.storeId;
      const response = await api.get<ApiResponse<MonthlyOperationReport>>('/reports/operation', { params });
      setOperationData(response.data.data);
    } catch (err: any) {
      setError(err.message || '加载运营报告失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCostReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.storeId) params.storeId = filters.storeId;
      const response = await api.get<ApiResponse<CostControlReport>>('/reports/cost-control', { params });
      setCostData(response.data.data);
    } catch (err: any) {
      setError(err.message || '加载成本报告失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'operation') {
      fetchOperationReport();
    } else {
      fetchCostReport();
    }
  }, [activeTab, filters]);

  const handlePreview = () => {
    setPreviewModalOpen(true);
  };

  const handleDownload = async (type: 'operation' | 'cost') => {
    try {
      setDownloading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.storeId) params.storeId = filters.storeId;
      const response = await api.get(`/reports/${type}`, {
        params: { ...params, format: 'excel' },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type === 'operation' ? '运营分析报告' : '成本控制明细'}_${filters.year}${filters.month || ''}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err.message || '下载失败');
    } finally {
      setDownloading(false);
    }
  };

  const storeOptions = [
    { value: '', label: '全部门店' },
    { value: 's001', label: '上海南京路店' },
    { value: 's002', label: '上海陆家嘴店' },
    { value: 's003', label: '上海徐汇店' },
  ];

  const monthOptions = [
    { value: '', label: '全部月份' },
    { value: '01', label: '1月' },
    { value: '02', label: '2月' },
    { value: '03', label: '3月' },
    { value: '04', label: '4月' },
    { value: '05', label: '5月' },
    { value: '06', label: '6月' },
    { value: '07', label: '7月' },
    { value: '08', label: '8月' },
    { value: '09', label: '9月' },
    { value: '10', label: '10月' },
    { value: '11', label: '11月' },
    { value: '12', label: '12月' },
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: (new Date().getFullYear() - i).toString(),
    label: `${new Date().getFullYear() - i}年`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">报表中心</h1>
            <p className="text-sm text-slate-500">运营分析报告、成本控制明细</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertCircle size={14} className="text-amber-400" />
          <span className="text-xs font-medium text-amber-400">L3 权限</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-500/20 rounded-lg">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('operation')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'operation'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            月度运营分析
          </button>
          <button
            onClick={() => setActiveTab('cost')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'cost'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            成本控制明细
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 px-4 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          >
            {yearOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 px-4 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          >
            {monthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filters.storeId}
            onChange={(e) => setFilters({ ...filters, storeId: e.target.value })}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 px-4 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          >
            {storeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30 transition-all"
          >
            <Eye size={18} />
            预览
          </button>
          <button
            onClick={() => handleDownload(activeTab)}
            disabled={downloading || loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <><Loading type="spinner" size="sm" /> 导出中...</>
            ) : (
              <><Download size={18} /> 导出报告</>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <Loading text="加载中..." />
      ) : activeTab === 'operation' && operationData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-4">
            <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">总营收</span>
                <DollarSign size={18} className="text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(operationData.totalRevenue)}</p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                {operationData.revenueGrowth >= 0 ? (
                  <TrendingUp size={12} className="text-green-400" />
                ) : (
                  <TrendingDown size={12} className="text-red-400" />
                )}
                <span className={operationData.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {operationData.revenueGrowth >= 0 ? '+' : ''}{operationData.revenueGrowth}%
                </span>
                <span className="text-slate-500">环比</span>
              </div>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">总成本</span>
                <DollarSign size={18} className="text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(operationData.totalCost)}</p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                {operationData.costGrowth >= 0 ? (
                  <TrendingUp size={12} className="text-red-400" />
                ) : (
                  <TrendingDown size={12} className="text-green-400" />
                )}
                <span className={operationData.costGrowth >= 0 ? 'text-red-400' : 'text-green-400'}>
                  {operationData.costGrowth >= 0 ? '+' : ''}{operationData.costGrowth}%
                </span>
                <span className="text-slate-500">环比</span>
              </div>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">净利润</span>
                <DollarSign size={18} className="text-cyan-400" />
              </div>
              <p className={cn(
                'text-2xl font-bold',
                operationData.netProfit >= 0 ? 'text-cyan-400' : 'text-red-400'
              )}>
                {formatCurrency(operationData.netProfit)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                {operationData.profitGrowth >= 0 ? (
                  <TrendingUp size={12} className="text-green-400" />
                ) : (
                  <TrendingDown size={12} className="text-red-400" />
                )}
                <span className={operationData.profitGrowth >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {operationData.profitGrowth >= 0 ? '+' : ''}{operationData.profitGrowth}%
                </span>
                <span className="text-slate-500">环比</span>
              </div>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">订单数</span>
                <ShoppingCart size={18} className="text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-400">{formatNumber(operationData.orderCount)}</p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                {operationData.orderGrowth >= 0 ? (
                  <TrendingUp size={12} className="text-green-400" />
                ) : (
                  <TrendingDown size={12} className="text-red-400" />
                )}
                <span className={operationData.orderGrowth >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {operationData.orderGrowth >= 0 ? '+' : ''}{operationData.orderGrowth}%
                </span>
                <span className="text-slate-500">环比</span>
              </div>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">会员消费</span>
                <Users size={18} className="text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-orange-400">{formatCurrency(operationData.memberSpending)}</p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span className="text-slate-400">占比 {operationData.memberSpendingRatio}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <h4 className="font-medium text-slate-200 mb-4">门店营收排行</h4>
              <div className="space-y-3">
                {operationData.storeRanking?.map((store: any, index: number) => (
                  <div key={store.storeId} className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 ? 'bg-yellow-500 text-slate-900' :
                      index === 1 ? 'bg-slate-400 text-slate-900' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-700 text-slate-300'
                    )}>
                      {index + 1}
                    </span>
                    <span className="text-slate-300 flex-1">{store.storeName}</span>
                    <span className="font-mono font-medium text-green-400">{formatCurrency(store.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <h4 className="font-medium text-slate-200 mb-4">菜品销量Top10</h4>
              <div className="space-y-3">
                {operationData.dishRanking?.map((dish: any, index: number) => (
                  <div key={dish.dishId} className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 ? 'bg-yellow-500 text-slate-900' :
                      index === 1 ? 'bg-slate-400 text-slate-900' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-700 text-slate-300'
                    )}>
                      {index + 1}
                    </span>
                    <span className="text-slate-300 flex-1">{dish.dishName}</span>
                    <span className="font-mono font-medium text-cyan-400">{formatNumber(dish.sales)} 份</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <h4 className="font-medium text-slate-200 mb-4">关键指标分析</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">客单价</p>
                <p className="text-xl font-bold text-slate-200">{formatCurrency(operationData.avgOrderValue)}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">毛利率</p>
                <p className="text-xl font-bold text-green-400">{operationData.grossMargin}%</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">净利率</p>
                <p className="text-xl font-bold text-cyan-400">{operationData.netMargin}%</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">成本率</p>
                <p className="text-xl font-bold text-orange-400">{operationData.costRatio}%</p>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'cost' && costData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30">
              <p className="text-sm text-slate-400 mb-2">食材成本</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(costData.ingredientCost)}</p>
              <p className="text-xs text-slate-500 mt-1">占比 {costData.ingredientRatio}%</p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30">
              <p className="text-sm text-slate-400 mb-2">人力成本</p>
              <p className="text-2xl font-bold text-orange-400">{formatCurrency(costData.laborCost)}</p>
              <p className="text-xs text-slate-500 mt-1">占比 {costData.laborRatio}%</p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-yellow-500/10 to-lime-500/10 border border-yellow-500/30">
              <p className="text-sm text-slate-400 mb-2">运营成本</p>
              <p className="text-2xl font-bold text-yellow-400">{formatCurrency(costData.operationCost)}</p>
              <p className="text-xs text-slate-500 mt-1">占比 {costData.operationRatio}%</p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              <p className="text-sm text-slate-400 mb-2">其他成本</p>
              <p className="text-2xl font-bold text-purple-400">{formatCurrency(costData.otherCost)}</p>
              <p className="text-xs text-slate-500 mt-1">占比 {costData.otherRatio}%</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <h4 className="font-medium text-slate-200 mb-4">成本明细</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">类别</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">项目</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">预算</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">实际</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">差异</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {costData.details?.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-800/20">
                      <td className="px-4 py-3 text-sm text-slate-300">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-slate-200">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-slate-400">{formatCurrency(item.budget)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-red-400">{formatCurrency(item.actual)}</td>
                      <td className={cn(
                        'px-4 py-3 text-sm text-right font-mono font-semibold',
                        item.variance >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{item.remark || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <h4 className="font-medium text-slate-200 mb-4">成本控制建议</h4>
            <div className="space-y-3">
              {costData.recommendations?.map((rec: any, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      rec.priority === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-green-500/20 text-green-400'
                    )}>
                      <AlertCircle size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{rec.title}</p>
                      <p className="text-sm text-slate-400 mt-1">{rec.description}</p>
                      <p className="text-xs text-cyan-400 mt-2">预计节约: {formatCurrency(rec.potentialSaving)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-indigo-400" />
                <h3 className="text-lg font-semibold text-slate-100">
                  {activeTab === 'operation' ? '月度运营分析报告' : '成本控制明细'}
                </h3>
                <span className="text-sm text-slate-500">
                  <Calendar size={14} className="inline mr-1" />
                  {filters.year}年{filters.month ? `${filters.month}月` : ''}
                </span>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-slate-950">
              <div className="max-w-4xl mx-auto bg-white rounded-xl p-8">
                <div className="text-center mb-8 border-b pb-6">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {activeTab === 'operation' ? '月度运营分析报告' : '成本控制明细报告'}
                  </h1>
                  <p className="text-slate-500">
                    {filters.year}年{filters.month ? `${filters.month}月` : ''}
                    {filters.storeId ? ` · ${storeOptions.find(s => s.value === filters.storeId)?.label}` : ' · 全部门店'}
                  </p>
                </div>
                {activeTab === 'operation' && operationData ? (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 mb-4">一、核心指标</h2>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-slate-500">总营收</p>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(operationData.totalRevenue)}</p>
                          <p className="text-xs text-green-600">环比 {operationData.revenueGrowth >= 0 ? '+' : ''}{operationData.revenueGrowth}%</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                          <p className="text-sm text-slate-500">总成本</p>
                          <p className="text-xl font-bold text-red-600">{formatCurrency(operationData.totalCost)}</p>
                          <p className="text-xs text-red-600">环比 {operationData.costGrowth >= 0 ? '+' : ''}{operationData.costGrowth}%</p>
                        </div>
                        <div className="p-4 bg-cyan-50 rounded-lg">
                          <p className="text-sm text-slate-500">净利润</p>
                          <p className="text-xl font-bold text-cyan-600">{formatCurrency(operationData.netProfit)}</p>
                          <p className="text-xs text-cyan-600">环比 {operationData.profitGrowth >= 0 ? '+' : ''}{operationData.profitGrowth}%</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-slate-500">订单数</p>
                          <p className="text-xl font-bold text-purple-600">{formatNumber(operationData.orderCount)}</p>
                          <p className="text-xs text-purple-600">环比 {operationData.orderGrowth >= 0 ? '+' : ''}{operationData.orderGrowth}%</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 mb-4">二、门店营收排行</h2>
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600">排名</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600">门店</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold text-slate-600">营收</th>
                          </tr>
                        </thead>
                        <tbody>
                          {operationData.storeRanking?.map((store: any, index: number) => (
                            <tr key={store.storeId} className="border-b">
                              <td className="px-4 py-2 text-sm">{index + 1}</td>
                              <td className="px-4 py-2 text-sm">{store.storeName}</td>
                              <td className="px-4 py-2 text-sm text-right font-mono">{formatCurrency(store.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : costData ? (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 mb-4">一、成本汇总</h2>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 bg-red-50 rounded-lg">
                          <p className="text-sm text-slate-500">食材成本</p>
                          <p className="text-xl font-bold text-red-600">{formatCurrency(costData.ingredientCost)}</p>
                          <p className="text-xs text-slate-500">占比 {costData.ingredientRatio}%</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-slate-500">人力成本</p>
                          <p className="text-xl font-bold text-orange-600">{formatCurrency(costData.laborCost)}</p>
                          <p className="text-xs text-slate-500">占比 {costData.laborRatio}%</p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-slate-500">运营成本</p>
                          <p className="text-xl font-bold text-yellow-600">{formatCurrency(costData.operationCost)}</p>
                          <p className="text-xs text-slate-500">占比 {costData.operationRatio}%</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-slate-500">其他成本</p>
                          <p className="text-xl font-bold text-purple-600">{formatCurrency(costData.otherCost)}</p>
                          <p className="text-xs text-slate-500">占比 {costData.otherRatio}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setPreviewModalOpen(false);
                  handleDownload(activeTab);
                }}
                disabled={downloading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                导出Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
