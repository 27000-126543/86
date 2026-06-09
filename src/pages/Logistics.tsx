import { useState, useEffect } from 'react';
import { Truck, Thermometer, AlertTriangle, Eye, X, RefreshCw, Zap, MapPin, Clock, Package } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Loading } from '@/components/Loading';
import { api } from '@/utils/api';
import { formatDateTime, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { DeliveryOrder, PaginationResult, TemperatureRecord, DeliveryItem, ApiResponse } from '@/../shared/types';

export default function Logistics() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [tempModalOpen, setTempModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [temperatureLogs, setTemperatureLogs] = useState<TemperatureRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [emergencyForm, setEmergencyForm] = useState({
    storeId: '',
    items: [{ materialName: '', quantity: 0, unit: 'kg' }],
    reason: '',
  });

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const response = await api.get<ApiResponse<PaginationResult<DeliveryOrder>>>('/logistics/delivery', { params });
      setDeliveries(response.data.data.list);
    } catch (err: any) {
      setError(err.message || '加载配送数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const handleViewDetail = async (delivery: DeliveryOrder) => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<DeliveryOrder>>(`/logistics/delivery/${delivery.id}`);
      setSelectedDelivery(response.data.data);
      setDetailModalOpen(true);
    } catch (err: any) {
      setError(err.message || '获取详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTemperature = async (delivery: DeliveryOrder) => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<TemperatureRecord[]>>(`/logistics/temperature/${delivery.id}`);
      setTemperatureLogs(response.data.data);
      setSelectedDelivery(delivery);
      setTempModalOpen(true);
    } catch (err: any) {
      setError(err.message || '获取温控记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyReplenish = async () => {
    if (!emergencyForm.storeId || emergencyForm.items.some(i => !i.materialName || i.quantity <= 0)) return;
    try {
      setSubmitting(true);
      await api.post('/logistics/emergency-replenish', emergencyForm);
      setEmergencyModalOpen(false);
      setEmergencyForm({
        storeId: '',
        items: [{ materialName: '', quantity: 0, unit: 'kg' }],
        reason: '',
      });
      fetchDeliveries();
    } catch (err: any) {
      setError(err.message || '触发应急补货失败');
    } finally {
      setSubmitting(false);
    }
  };

  const isTemperatureAlert = (delivery: DeliveryOrder) => {
    const { currentTemperature, targetTemperature } = delivery;
    return currentTemperature < targetTemperature.min || currentTemperature > targetTemperature.max;
  };

  const getTempColor = (temp: number, min: number, max: number) => {
    if (temp < min || temp > max) return 'text-red-400';
    return 'text-cyan-400';
  };

  const addEmergencyItem = () => {
    setEmergencyForm({
      ...emergencyForm,
      items: [...emergencyForm.items, { materialName: '', quantity: 0, unit: 'kg' }],
    });
  };

  const updateEmergencyItem = (index: number, field: string, value: string | number) => {
    const newItems = [...emergencyForm.items];
    (newItems[index] as any)[field] = value;
    setEmergencyForm({ ...emergencyForm, items: newItems });
  };

  const removeEmergencyItem = (index: number) => {
    if (emergencyForm.items.length > 1) {
      setEmergencyForm({
        ...emergencyForm,
        items: emergencyForm.items.filter((_, i) => i !== index),
      });
    }
  };

  const columns = [
    {
      key: 'orderNo',
      title: '配送单号',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono font-medium text-cyan-400">{value}</span>
      ),
    },
    {
      key: 'storeName',
      title: '门店',
      sortable: true,
      render: (value: string) => <span className="text-slate-200">{value}</span>,
    },
    {
      key: 'vehicleId',
      title: '车辆',
      render: (value: string) => <span className="font-mono text-slate-300">{value}</span>,
    },
    {
      key: 'driverName',
      title: '司机',
      render: (value: string) => <span className="text-slate-300">{value}</span>,
    },
    {
      key: 'currentTemperature',
      title: '当前温度',
      render: (_: any, row: DeliveryOrder) => {
        const alert = isTemperatureAlert(row);
        return (
          <div className="flex items-center gap-2">
            <Thermometer size={16} className={alert ? 'text-red-400 animate-pulse' : 'text-cyan-400'} />
            <span className={cn(
              'font-mono font-semibold',
              getTempColor(row.currentTemperature, row.targetTemperature.min, row.targetTemperature.max)
            )}>
              {row.currentTemperature.toFixed(1)}°C
            </span>
            {alert && (
              <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full animate-pulse">
                超温
              </span>
            )}
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
      key: 'estimatedArrival',
      title: '预计送达',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1 text-slate-300">
          <Clock size={14} className="text-slate-500" />
          {formatDateTime(value)}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 140,
      render: (_: any, row: DeliveryOrder) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleViewTemperature(row)}
            className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
            title="温控记录"
          >
            <Thermometer size={16} />
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'scheduled', label: '待发车' },
    { value: 'loading', label: '装载中' },
    { value: 'in_transit', label: '运输中' },
    { value: 'arrived', label: '已送达' },
    { value: 'delayed', label: '延误' },
    { value: 'alert', label: '告警' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Truck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">冷链配送调度</h1>
            <p className="text-sm text-slate-500">实时监控配送温度，应急补货调度</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDeliveries}
            className="p-2.5 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
            title="刷新"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 px-4 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setEmergencyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-red-500 to-orange-600 text-white hover:shadow-lg hover:shadow-red-500/20 transition-all"
          >
            <Zap size={18} />
            应急补货
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertTriangle size={20} />
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
          data={deliveries}
          loading={loading}
          rowKey="id"
          emptyText="暂无配送任务"
        />
      )}

      {detailModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Package size={20} className="text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-100">配送详情</h3>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">配送单号</p>
                  <p className="font-mono font-medium text-cyan-400">{selectedDelivery.orderNo}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">门店</p>
                  <p className="font-medium text-slate-200">{selectedDelivery.storeName}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">车辆/司机</p>
                  <p className="font-mono text-slate-300">{selectedDelivery.vehicleId}</p>
                  <p className="text-sm text-slate-400">{selectedDelivery.driverName}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">状态</p>
                  <StatusBadge status={selectedDelivery.status} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-200">温度监控</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">标准范围:</span>
                    <span className="font-mono text-cyan-400">
                      {selectedDelivery.targetTemperature.min} ~ {selectedDelivery.targetTemperature.max}°C
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <Thermometer size={32} className={cn(
                      'mx-auto mb-2',
                      isTemperatureAlert(selectedDelivery) ? 'text-red-400 animate-pulse' : 'text-cyan-400'
                    )} />
                    <p className={cn(
                      'text-3xl font-mono font-bold',
                      getTempColor(selectedDelivery.currentTemperature, selectedDelivery.targetTemperature.min, selectedDelivery.targetTemperature.max)
                    )}>
                      {selectedDelivery.currentTemperature.toFixed(1)}°C
                    </p>
                    {isTemperatureAlert(selectedDelivery) && (
                      <p className="text-xs text-red-400 mt-1 flex items-center justify-center gap-1">
                        <AlertTriangle size={12} />
                        温度异常
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-200 mb-3">配送物品</h4>
                <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800/50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase">物品名称</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-400 uppercase">数量</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {selectedDelivery.items.map((item: DeliveryItem) => (
                        <tr key={item.id} className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 text-sm text-slate-300">{item.materialName}</td>
                          <td className="px-4 py-3 text-sm text-slate-300 text-center font-mono">
                            {formatNumber(item.quantity)} {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">预计送达</p>
                  <p className="text-slate-200">{formatDateTime(selectedDelivery.estimatedArrival)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">实际送达</p>
                  <p className="text-slate-200">{selectedDelivery.actualArrival ? formatDateTime(selectedDelivery.actualArrival) : '-'}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  handleViewTemperature(selectedDelivery);
                }}
                className="px-5 py-2.5 rounded-xl text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30 transition-colors"
              >
                查看温控记录
              </button>
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

      {tempModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Thermometer size={20} className="text-cyan-400" />
                <h3 className="text-lg font-semibold text-slate-100">温控记录</h3>
              </div>
              <button
                onClick={() => setTempModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="mb-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">配送单号</p>
                    <p className="font-mono font-medium text-cyan-400">{selectedDelivery.orderNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">标准温度范围</p>
                    <p className="font-mono text-cyan-400">
                      {selectedDelivery.targetTemperature.min} ~ {selectedDelivery.targetTemperature.max}°C
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {temperatureLogs.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">暂无温控记录</p>
                ) : (
                  temperatureLogs.map((log, idx) => {
                    const isAlert = log.temperature < selectedDelivery.targetTemperature.min ||
                                   log.temperature > selectedDelivery.targetTemperature.max;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border transition-all',
                          isAlert
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-slate-800/30 border-slate-700/50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Clock size={14} className="text-slate-500" />
                          <span className="text-sm text-slate-300">{formatDateTime(log.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin size={14} className="text-slate-500" />
                          <span className="text-sm text-slate-400">{log.location}</span>
                          <span className={cn(
                            'font-mono font-semibold min-w-[80px] text-right',
                            isAlert ? 'text-red-400' : 'text-cyan-400'
                          )}>
                            {log.temperature.toFixed(1)}°C
                          </span>
                          {isAlert && <AlertTriangle size={14} className="text-red-400 animate-pulse" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => setTempModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-orange-400" />
                <h3 className="text-lg font-semibold text-slate-100">应急补货</h3>
              </div>
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                <p className="text-sm text-orange-400">
                  <Zap size={14} className="inline mr-1" />
                  应急补货将优先调度，预计2小时内送达
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">补货门店</label>
                <select
                  value={emergencyForm.storeId}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, storeId: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                >
                  <option value="">请选择门店</option>
                  <option value="s001">上海南京路店</option>
                  <option value="s002">上海陆家嘴店</option>
                  <option value="s003">上海徐汇店</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">补货物品</label>
                  <button
                    type="button"
                    onClick={addEmergencyItem}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    + 添加物品
                  </button>
                </div>
                <div className="space-y-2">
                  {emergencyForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="物品名称"
                        value={item.materialName}
                        onChange={(e) => updateEmergencyItem(idx, 'materialName', e.target.value)}
                        className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                      <input
                        type="number"
                        placeholder="数量"
                        value={item.quantity || ''}
                        onChange={(e) => updateEmergencyItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-24 bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                      <input
                        type="text"
                        placeholder="单位"
                        value={item.unit}
                        onChange={(e) => updateEmergencyItem(idx, 'unit', e.target.value)}
                        className="w-20 bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                      {emergencyForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmergencyItem(idx)}
                          className="p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">补货原因</label>
                <textarea
                  value={emergencyForm.reason}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, reason: e.target.value })}
                  placeholder="请说明补货原因..."
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleEmergencyReplenish}
                disabled={submitting || !emergencyForm.storeId || emergencyForm.items.some(i => !i.materialName || i.quantity <= 0)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-red-500 to-orange-600 text-white hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '提交中...' : '触发应急补货'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
