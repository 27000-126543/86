import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, CheckCircle2, XCircle, Eye, AlertCircle, X, History, ChevronRight, FileText } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Loading } from '@/components/Loading';
import { api } from '@/utils/api';
import { formatCurrency, formatDateTime, getStatusText } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { PurchaseOrder, PaginationResult, ApprovalRecord, PurchaseItem, ApiResponse } from '@/../shared/types';

export default function Purchase() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const response = await api.get<ApiResponse<PaginationResult<PurchaseOrder>>>('/purchase', { params });
      setOrders(response.data.data.list);
    } catch (err: any) {
      setError(err.message || '加载采购单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleViewDetail = async (order: PurchaseOrder) => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<PurchaseOrder>>(`/purchase/${order.id}`);
      setSelectedOrder(response.data.data);
      setDetailModalOpen(true);
    } catch (err: any) {
      setError(err.message || '获取详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;
    try {
      setSubmitting(true);
      await api.post(`/purchase/${selectedOrder.id}/approve`, { comment });
      setApproveModalOpen(false);
      setComment('');
      fetchOrders();
    } catch (err: any) {
      setError(err.message || '审批失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder) return;
    try {
      setSubmitting(true);
      await api.post(`/purchase/${selectedOrder.id}/reject`, { comment });
      setRejectModalOpen(false);
      setComment('');
      fetchOrders();
    } catch (err: any) {
      setError(err.message || '拒绝失败');
    } finally {
      setSubmitting(false);
    }
  };

  const openApproveModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setComment('');
    setApproveModalOpen(true);
  };

  const openRejectModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setComment('');
    setRejectModalOpen(true);
  };

  const getApprovalSteps = (order: PurchaseOrder) => {
    const steps = [
      { key: 'pending', label: '店长审批', done: ['approved_store', 'approved_region', 'approved_general', 'completed'].includes(order.status) },
      { key: 'approved_store', label: '区域审批', done: ['approved_region', 'approved_general', 'completed'].includes(order.status) },
      { key: 'approved_region', label: '总经理审批', done: ['approved_general', 'completed'].includes(order.status) },
      { key: 'completed', label: '完成', done: order.status === 'completed' },
    ];
    return steps;
  };

  const columns = [
    {
      key: 'orderNo',
      title: '采购单号',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono font-medium text-cyan-400">{value}</span>
      ),
    },
    {
      key: 'storeName',
      title: '门店',
      sortable: true,
      render: (value: string) => (
        <span className="text-slate-200">{value}</span>
      ),
    },
    {
      key: 'totalAmount',
      title: '金额',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono font-semibold text-emerald-400">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (value: string, row: PurchaseOrder) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={value} />
          {row.status === 'escalated' && (
            <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full animate-pulse">
              已升级
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'currentApproverName',
      title: '当前审批人',
      render: (value: string) => value || <span className="text-slate-500">-</span>,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      sortable: true,
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'actions',
      title: '操作',
      width: 160,
      render: (_: any, row: PurchaseOrder) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
          {['pending', 'approved_store', 'approved_region', 'escalated'].includes(row.status) && (
            <>
              <button
                onClick={() => openApproveModal(row)}
                className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors"
                title="审批通过"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={() => openRejectModal(row)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                title="拒绝"
              >
                <XCircle size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待审批' },
    { value: 'approved_store', label: '店长已批' },
    { value: 'approved_region', label: '区域已批' },
    { value: 'completed', label: '已完成' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'escalated', label: '已升级' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShoppingCart size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">采购管理</h1>
            <p className="text-sm text-slate-500">管理采购订单，多级审批流程</p>
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
          emptyText="暂无采购单"
        />
      )}

      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-cyan-400" />
                <h3 className="text-lg font-semibold text-slate-100">采购单详情</h3>
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
                  <p className="text-xs text-slate-500 mb-1">采购单号</p>
                  <p className="font-mono font-medium text-cyan-400">{selectedOrder.orderNo}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">门店</p>
                  <p className="font-medium text-slate-200">{selectedOrder.storeName}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">总金额</p>
                  <p className="font-mono font-semibold text-emerald-400 text-lg">{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">状态</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <h4 className="font-medium text-slate-200 mb-4">审批流程</h4>
                <div className="flex items-center">
                  {getApprovalSteps(selectedOrder).map((step, idx) => (
                    <div key={step.key} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                          step.done
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : idx === getApprovalSteps(selectedOrder).findIndex(s => !s.done)
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                            : 'bg-slate-700/50 text-slate-500 border border-slate-600/30'
                        )}>
                          {step.done ? <CheckCircle2 size={16} /> : idx + 1}
                        </div>
                        <span className={cn(
                          'text-xs mt-2',
                          step.done ? 'text-green-400' : 'text-slate-500'
                        )}>
                          {step.label}
                        </span>
                      </div>
                      {idx < getApprovalSteps(selectedOrder).length - 1 && (
                        <ChevronRight size={20} className={cn(
                          'mx-2',
                          step.done ? 'text-green-500/50' : 'text-slate-600'
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-200 mb-3">采购明细</h4>
                <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800/50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase">物料名称</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase">规格</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-400 uppercase">数量</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-400 uppercase">单价</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-400 uppercase">小计</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {selectedOrder.items.map((item: PurchaseItem) => (
                        <tr key={item.id} className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 text-sm text-slate-300">{item.materialName}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{item.specification}</td>
                          <td className="px-4 py-3 text-sm text-slate-300 text-center font-mono">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-3 text-sm text-slate-400 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-sm text-emerald-400 text-right font-mono font-medium">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder.approvalHistory.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <History size={16} className="text-slate-400" />
                    <h4 className="font-medium text-slate-200">审批历史</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.approvalHistory.map((record: ApprovalRecord) => (
                      <div key={record.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-200">{record.approverName}</span>
                            <span className="text-xs text-slate-500">{record.role}</span>
                            <span className={cn(
                              'px-2 py-0.5 text-xs rounded-full',
                              record.action === 'approve'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            )}>
                              {record.action === 'approve' ? '同意' : '拒绝'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">{formatDateTime(record.createdAt)}</span>
                        </div>
                        {record.comment && (
                          <p className="text-sm text-slate-400">意见: {record.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                关闭
              </button>
              {['pending', 'approved_store', 'approved_region', 'escalated'].includes(selectedOrder.status) && (
                <>
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      openRejectModal(selectedOrder);
                    }}
                    className="px-5 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/30 transition-colors"
                  >
                    拒绝
                  </button>
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      openApproveModal(selectedOrder);
                    }}
                    className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/20 transition-all"
                  >
                    通过
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {approveModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">审批通过</h3>
              <button
                onClick={() => setApproveModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle2 size={18} />
                  <span className="font-medium">确认审批通过</span>
                </div>
                <p className="text-sm text-slate-400">
                  采购单 <span className="text-cyan-400 font-mono">{selectedOrder.orderNo}</span>
                </p>
                <p className="text-sm text-emerald-400 font-mono mt-1">
                  金额: {formatCurrency(selectedOrder.totalAmount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">审批意见 (可选)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="请输入审批意见..."
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '提交中...' : '确认通过'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">拒绝采购单</h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <XCircle size={18} />
                  <span className="font-medium">确认拒绝</span>
                </div>
                <p className="text-sm text-slate-400">
                  采购单 <span className="text-cyan-400 font-mono">{selectedOrder.orderNo}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">拒绝原因</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="请输入拒绝原因..."
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={submitting || !comment.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '提交中...' : '确认拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
