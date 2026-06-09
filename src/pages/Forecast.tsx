import { useState, useEffect } from 'react';
import { TrendingUp, Plus, Edit2, ShoppingCart, AlertCircle, CheckCircle2, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Loading } from '@/components/Loading';
import { api } from '@/utils/api';
import { formatDate, formatNumber, formatPercent, getStatusText } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { ForecastItem, PaginationResult, ApiResponse } from '@/../shared/types';

export default function Forecast() {
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<ForecastItem | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [storeId, setStoreId] = useState('');
  const [forecastDate, setForecastDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<PaginationResult<ForecastItem>>>('/forecast');
      setForecasts(response.data.data.list);
    } catch (err: any) {
      setError(err.message || '加载预测数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, []);

  const handleGenerate = async () => {
    try {
      setSubmitting(true);
      await api.post('/forecast/generate', { storeId, forecastDate });
      setGenerateModalOpen(false);
      fetchForecasts();
    } catch (err: any) {
      setError(err.message || '生成预测失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: ForecastItem) => {
    setSelectedForecast(item);
    setEditQuantity(item.forecastQuantity);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedForecast) return;
    try {
      setSubmitting(true);
      await api.put(`/forecast/${selectedForecast.id}`, {
        forecastQuantity: editQuantity,
        status: 'adjusted',
      });
      setEditModalOpen(false);
      fetchForecasts();
    } catch (err: any) {
      setError(err.message || '调整预测失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePurchase = async () => {
    try {
      setSubmitting(true);
      await api.post('/purchase', {
        forecastIds: selectedItems,
        storeId,
      });
      setPurchaseModalOpen(false);
      setSelectedItems([]);
      fetchForecasts();
    } catch (err: any) {
      setError(err.message || '生成采购单失败');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const columns = [
    {
      key: 'select',
      title: '',
      width: 40,
      align: 'center' as const,
      render: (_: any, row: ForecastItem) => (
        <input
          type="checkbox"
          checked={selectedItems.includes(row.id)}
          onChange={() => toggleSelectItem(row.id)}
          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50"
        />
      ),
    },
    {
      key: 'dishName',
      title: '菜品名称',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-slate-200">{value}</span>
      ),
    },
    {
      key: 'forecastDate',
      title: '预测日期',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'historicalData',
      title: '历史销量',
      render: (value: number[], row: ForecastItem) => {
        const avg = value?.length ? Math.round(value.reduce((a, b) => a + b, 0) / value.length) : 0;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400">{formatNumber(avg)}</span>
            <span className="text-xs text-slate-500">(7日均值)</span>
          </div>
        );
      },
    },
    {
      key: 'weatherFactor',
      title: '天气系数',
      render: (value: number) => (
        <span className={cn(
          'font-mono',
          value > 1 ? 'text-green-400' : value < 0.95 ? 'text-orange-400' : 'text-slate-300'
        )}>
          {value?.toFixed(2) || '-'}
        </span>
      ),
    },
    {
      key: 'forecastQuantity',
      title: '预测数量',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono font-semibold text-cyan-400">{formatNumber(value)}</span>
      ),
    },
    {
      key: 'confidence',
      title: '置信度',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                value >= 0.9 ? 'bg-green-500' : value >= 0.75 ? 'bg-yellow-500' : 'bg-orange-500'
              )}
              style={{ width: `${(value || 0) * 100}%` }}
            />
          </div>
          <span className="font-mono text-sm">{formatPercent(value)}</span>
        </div>
      ),
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
      render: (_: any, row: ForecastItem) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="调整预测"
          >
            <Edit2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">需求预测</h1>
            <p className="text-sm text-slate-500">智能算法预测销量，辅助采购决策</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {selectedItems.length > 0 && (
            <span className="text-sm text-slate-400">
              已选择 <span className="text-cyan-400 font-medium">{selectedItems.length}</span> 项
            </span>
          )}
          <button
            onClick={() => setPurchaseModalOpen(true)}
            disabled={selectedItems.length === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
              selectedItems.length > 0
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/20'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            )}
          >
            <ShoppingCart size={18} />
            生成采购单
          </button>
          <button
            onClick={() => setGenerateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
          >
            <Plus size={18} />
            生成预测
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
          data={forecasts}
          loading={loading}
          rowKey="id"
          emptyText="暂无预测数据"
        />
      )}

      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">生成需求预测</h3>
              <button
                onClick={() => setGenerateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">预测日期</label>
                <input
                  type="date"
                  value={forecastDate}
                  onChange={(e) => setForecastDate(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
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
                disabled={submitting || !forecastDate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '生成中...' : '生成预测'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && selectedForecast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">调整预测数量</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-sm text-slate-400 mb-1">菜品</p>
                <p className="font-medium text-slate-200">{selectedForecast.dishName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">预测数量</label>
                <input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono text-lg"
                />
                <p className="mt-2 text-xs text-slate-500">
                  原预测数量: <span className="text-slate-400">{selectedForecast.forecastQuantity}</span>
                  {editQuantity !== selectedForecast.forecastQuantity && (
                    <span className="ml-2 text-orange-400">
                      (调整: {editQuantity > selectedForecast.forecastQuantity ? '+' : ''}{editQuantity - selectedForecast.forecastQuantity})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={submitting || editQuantity === selectedForecast.forecastQuantity}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '保存中...' : '保存调整'}
              </button>
            </div>
          </div>
        </div>
      )}

      {purchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">生成采购单</h3>
              <button
                onClick={() => setPurchaseModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <CheckCircle2 size={18} />
                  <span className="font-medium">确认生成采购单</span>
                </div>
                <p className="text-sm text-slate-400">
                  将为选中的 <span className="text-cyan-400 font-medium">{selectedItems.length}</span> 个预测项生成采购单
                </p>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {forecasts
                  .filter(f => selectedItems.includes(f.id))
                  .map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-sm text-slate-300">{item.dishName}</span>
                      <span className="text-sm font-mono text-cyan-400">{item.forecastQuantity} 份</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setPurchaseModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleGeneratePurchase}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '生成中...' : '确认生成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
