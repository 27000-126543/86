import { useState, useEffect } from 'react';
import { Wrench, Plus, UserCheck, Play, CheckCircle2, AlertCircle, X, Eye, AlertTriangle, Clock } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Loading } from '@/components/Loading';
import { api } from '@/utils/api';
import { formatDateTime, getStatusText } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { MaintenanceWorkOrder, PaginationResult, Equipment, PriorityLevel, ApiResponse } from '@/../shared/types';
import dayjs from 'dayjs';

export default function Maintenance() {
  const [orders, setOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceWorkOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [formData, setFormData] = useState({
    equipmentId: '',
    faultDescription: '',
    priority: 'medium' as PriorityLevel,
  });

  const [assigneeName, setAssigneeName] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const [ordersRes, equipmentsRes] = await Promise.all([
        api.get<ApiResponse<PaginationResult<MaintenanceWorkOrder>>>('/maintenance', { params }),
        api.get<ApiResponse<Equipment[]>>('/maintenance/equipment'),
      ]);
      setOrders(ordersRes.data.data.list);
      setEquipments(equipmentsRes.data.data);
    } catch (err: any) {
      setError(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCreate = async () => {
    if (!formData.equipmentId || !formData.faultDescription) return;
    try {
      setSubmitting(true);
      await api.post('/maintenance', formData);
      setCreateModalOpen(false);
      setFormData({ equipmentId: '', faultDescription: '', priority: 'medium' });
      fetchData();
    } catch (err: any) {
      setError(err.message || '创建工单失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedOrder || !assigneeName) return;
    try {
      setSubmitting(true);
      await api.post(`/maintenance/${selectedOrder.id}/assign`, {
        assigneeId: 'u009',
        assigneeName,
      });
      setAssignModalOpen(false);
      setAssigneeName('');
      fetchData();
    } catch (err: any) {
      setError(err.message || '指派失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (order: MaintenanceWorkOrder) => {
    try {
      setSubmitting(true);
      await api.post(`/maintenance/${order.id}/accept`);
      fetchData();
    } catch (err: any) {
      setError(err.message || '接单失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (order: MaintenanceWorkOrder) => {
    try {
      setSubmitting(true);
      await api.post(`/maintenance/${order.id}/complete`);
      fetchData();
    } catch (err: any) {
      setError(err.message || '完成失败');
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (createdAt: string, status: string) => {
    if (['accepted', 'in_progress', 'completed'].includes(status)) return false;
    const created = dayjs(createdAt);
    const now = dayjs();
    return now.diff(created, 'hour') > 2;
  };

  const openAssignModal = (order: MaintenanceWorkOrder) => {
    setSelectedOrder(order);
    setAssigneeName('');
    setAssignModalOpen(true);
  };

  const openDetailModal = (order: MaintenanceWorkOrder) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const priorityColors: Record<PriorityLevel, string> = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const priorityText: Record<PriorityLevel, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };

  const columns = [
    {
      key: 'orderNo',
      title: '工单号',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono font-medium text-cyan-400">{value}</span>
      ),
    },
    {
      key: 'equipmentName',
      title: '设备名称',
      sortable: true,
      render: (value: string) => <span className="text-slate-200">{value}</span>,
    },
    {
      key: 'faultDescription',
      title: '故障描述',
      render: (value: string) => (
        <span className="text-slate-300 line-clamp-1">{value}</span>
      ),
    },
    {
      key: 'priority',
      title: '优先级',
      render: (value: PriorityLevel) => (
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
          priorityColors[value]
        )}>
          {priorityText[value]}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (value: string, row: MaintenanceWorkOrder) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={value} />
          {isOverdue(row.createdAt, value) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full animate-pulse">
              <AlertTriangle size={10} />
              已升级
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'assigneeName',
      title: '指派人',
      render: (value: string) => value || <span className="text-slate-500">-</span>,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      sortable: true,
      render: (value: string, row: MaintenanceWorkOrder) => (
        <div className="flex flex-col">
          <span className="text-slate-300">{formatDateTime(value)}</span>
          {isOverdue(value, row.status) && (
            <span className="text-xs text-orange-400 flex items-center gap-1">
              <Clock size={10} />
              超2小时未接单
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      render: (_: any, row: MaintenanceWorkOrder) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openDetailModal(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
          {row.status === 'pending' && (
            <button
              onClick={() => openAssignModal(row)}
              className="p-1.5 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
              title="指派"
            >
              <UserCheck size={16} />
            </button>
          )}
          {row.status === 'assigned' && (
            <button
              onClick={() => handleAccept(row)}
              disabled={submitting}
              className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
              title="接单"
            >
              <Play size={16} />
            </button>
          )}
          {['accepted', 'in_progress'].includes(row.status) && (
            <button
              onClick={() => handleComplete(row)}
              disabled={submitting}
              className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors"
              title="完成"
            >
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待指派' },
    { value: 'assigned', label: '已指派' },
    { value: 'accepted', label: '已接单' },
    { value: 'in_progress', label: '处理中' },
    { value: 'completed', label: '已完成' },
    { value: 'escalated', label: '已升级' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Wrench size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">设备维修工单</h1>
            <p className="text-sm text-slate-500">设备故障报修，工单全流程跟踪</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-rose-500 to-red-600 text-white hover:shadow-lg hover:shadow-rose-500/20 transition-all"
          >
            <Plus size={18} />
            创建工单
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
          data={orders}
          loading={loading}
          rowKey="id"
          emptyText="暂无维修工单"
        />
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">创建设备维修工单</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">故障设备</label>
                <select
                  value={formData.equipmentId}
                  onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                >
                  <option value="">请选择设备</option>
                  {equipments.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} - {eq.location} ({getStatusText(eq.status)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">故障描述</label>
                <textarea
                  value={formData.faultDescription}
                  onChange={(e) => setFormData({ ...formData, faultDescription: e.target.value })}
                  placeholder="请详细描述故障现象..."
                  rows={4}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">优先级</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as PriorityLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: level })}
                      className={cn(
                        'py-2 px-3 rounded-xl text-sm font-medium border transition-all',
                        formData.priority === level
                          ? priorityColors[level]
                          : 'bg-slate-800/30 text-slate-400 border-slate-700/50 hover:bg-slate-800/50'
                      )}
                    >
                      {priorityText[level]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !formData.equipmentId || !formData.faultDescription}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-rose-500 to-red-600 text-white hover:shadow-lg hover:shadow-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '提交中...' : '创建工单'}
              </button>
            </div>
          </div>
        </div>
      )}

      {assignModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">指派维修人员</h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">工单</p>
                <p className="font-mono font-medium text-cyan-400">{selectedOrder.orderNo}</p>
                <p className="text-sm text-slate-400 mt-2">{selectedOrder.equipmentName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">维修人员</label>
                <input
                  type="text"
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  placeholder="请输入维修人员姓名"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAssign}
                disabled={submitting || !assigneeName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '指派中...' : '确认指派'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <div className="flex items-center gap-3">
                <Wrench size={20} className="text-rose-400" />
                <h3 className="text-lg font-semibold text-slate-100">工单详情</h3>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">工单号</p>
                  <p className="font-mono font-medium text-cyan-400">{selectedOrder.orderNo}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">设备</p>
                  <p className="font-medium text-slate-200">{selectedOrder.equipmentName}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">优先级</p>
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
                    priorityColors[selectedOrder.priority]
                  )}>
                    {priorityText[selectedOrder.priority]}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">状态</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-2">故障描述</p>
                <p className="text-slate-300">{selectedOrder.faultDescription}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">报修人</p>
                  <p className="text-slate-200">{selectedOrder.reporterName}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">指派人</p>
                  <p className="text-slate-200">{selectedOrder.assigneeName || '-'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">创建时间</p>
                  <p className="text-slate-300 text-sm">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">完成时间</p>
                  <p className="text-slate-300 text-sm">{selectedOrder.completedAt ? formatDateTime(selectedOrder.completedAt) : '-'}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                关闭
              </button>
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    openAssignModal(selectedOrder);
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                  指派
                </button>
              )}
              {selectedOrder.status === 'assigned' && (
                <button
                  onClick={() => {
                    handleAccept(selectedOrder);
                    setDetailModalOpen(false);
                  }}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                  接单
                </button>
              )}
              {['accepted', 'in_progress'].includes(selectedOrder.status) && (
                <button
                  onClick={() => {
                    handleComplete(selectedOrder);
                    setDetailModalOpen(false);
                  }}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/20 transition-all"
                >
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
