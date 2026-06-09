import { useState, useEffect } from 'react';
import { ChefHat, Plus, Play, CheckCircle2, AlertCircle, X, Eye, RefreshCw } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Loading } from '@/components/Loading';
import { api } from '@/utils/api';
import { formatDate, formatNumber, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { ProductionPlan, PaginationResult, ProductionItem, ApiResponse } from '@/../shared/types';

export default function Kitchen() {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [planDate, setPlanDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<PaginationResult<ProductionPlan>>>('/kitchen/production');
      setPlans(response.data.data.list);
    } catch (err: any) {
      setError(err.message || '加载生产计划失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleGenerate = async () => {
    try {
      setSubmitting(true);
      await api.post('/kitchen/production/generate', { date: planDate });
      setGenerateModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      setError(err.message || '生成排产失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (plan: ProductionPlan) => {
    setSelectedPlan(plan);
    setDetailModalOpen(true);
  };

  const handleUpdateItemStatus = async (planId: string, itemId: string, newStatus: string) => {
    try {
      setSubmitting(true);
      await api.put(`/kitchen/production/${planId}/status`, {
        itemId,
        itemStatus: newStatus,
      });
      fetchPlans();
      if (selectedPlan?.id === planId) {
        const response = await api.get<ApiResponse<PaginationResult<ProductionPlan>>>('/kitchen/production');
        const updated = response.data.data.list.find(p => p.id === planId);
        if (updated) setSelectedPlan(updated);
      }
    } catch (err: any) {
      setError(err.message || '更新状态失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalPlanned = (items: ProductionItem[]) =>
    items.reduce((sum, item) => sum + item.plannedQuantity, 0);

  const getTotalCompleted = (items: ProductionItem[]) =>
    items.reduce((sum, item) => sum + item.actualQuantity, 0);

  const columns = [
    {
      key: 'planNo',
      title: '计划编号',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono font-medium text-cyan-400">{value}</span>
      ),
    },
    {
      key: 'date',
      title: '日期',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'kitchenName',
      title: '厨房',
      render: (value: string) => <span className="text-slate-200">{value}</span>,
    },
    {
      key: 'items',
      title: '菜品',
      render: (value: ProductionItem[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 3).map(item => (
            <span key={item.id} className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-300 rounded">
              {item.dishName}
            </span>
          ))}
          {value.length > 3 && (
            <span className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
              +{value.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'plannedQuantity',
      title: '计划产量',
      align: 'right' as const,
      render: (_: any, row: ProductionPlan) => (
        <span className="font-mono text-slate-200">{formatNumber(getTotalPlanned(row.items))}</span>
      ),
    },
    {
      key: 'actualQuantity',
      title: '已完成',
      align: 'right' as const,
      render: (_: any, row: ProductionPlan) => {
        const completed = getTotalCompleted(row.items);
        const planned = getTotalPlanned(row.items);
        const progress = planned > 0 ? (completed / planned) * 100 : 0;
        return (
          <div className="flex items-center gap-2 justify-end">
            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-emerald-400">{formatNumber(completed)}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: '状态',
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: 100,
      render: (_: any, row: ProductionPlan) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <ChefHat size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">中央厨房排产</h1>
            <p className="text-sm text-slate-500">智能排产，生产状态实时跟踪</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlans}
            className="p-2.5 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
            title="刷新"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setGenerateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all"
          >
            <Plus size={18} />
            自动排产
          </button>
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

      {loading ? (
        <Loading text="加载中..." />
      ) : (
        <DataTable
          columns={columns}
          data={plans}
          loading={loading}
          rowKey="id"
          emptyText="暂无生产计划"
        />
      )}

      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">自动排产</h3>
              <button
                onClick={() => setGenerateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">排产日期</label>
                <input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                <p className="text-sm text-orange-400">
                  系统将根据需求预测自动生成生产计划
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setGenerateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleGenerate}
                disabled={submitting || !planDate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '生成中...' : '生成排产'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <ChefHat size={20} className="text-orange-400" />
                <h3 className="text-lg font-semibold text-slate-100">生产计划详情</h3>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">计划编号</p>
                  <p className="font-mono font-medium text-cyan-400">{selectedPlan.planNo}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">日期</p>
                  <p className="font-medium text-slate-200">{formatDate(selectedPlan.date)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">状态</p>
                  <StatusBadge status={selectedPlan.status} />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-200 mb-3">生产明细</h4>
                <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800/50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase">菜品</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-400 uppercase">计划产量</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-400 uppercase">实际产量</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-400 uppercase">开始时间</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-400 uppercase">状态</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-400 uppercase">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {selectedPlan.items.map((item: ProductionItem) => (
                        <tr key={item.id} className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 text-sm text-slate-300">{item.dishName}</td>
                          <td className="px-4 py-3 text-sm text-slate-300 text-center font-mono">{formatNumber(item.plannedQuantity)}</td>
                          <td className="px-4 py-3 text-sm text-emerald-400 text-center font-mono">{formatNumber(item.actualQuantity)}</td>
                          <td className="px-4 py-3 text-sm text-slate-400 text-center">
                            {item.startTime ? formatDateTime(item.startTime) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={item.status} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {item.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateItemStatus(selectedPlan.id, item.id, 'processing')}
                                  disabled={submitting}
                                  className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
                                  title="开始生产"
                                >
                                  <Play size={14} />
                                </button>
                              )}
                              {item.status === 'processing' && (
                                <button
                                  onClick={() => handleUpdateItemStatus(selectedPlan.id, item.id, 'completed')}
                                  disabled={submitting}
                                  className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors"
                                  title="完成生产"
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
