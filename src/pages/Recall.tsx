import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Eye, Check, X, AlertCircle, Clock, FileText, TrendingDown, User, MapPin, Package } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Loading } from '@/components/Loading';
import { api } from '@/utils/api';
import { formatDateTime, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { RecallWorkOrder, PaginationResult, TraceabilityNode, User as UserType, ApiResponse } from '@/../shared/types';

export default function Recall() {
  const [records, setRecords] = useState<RecallWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [traceModalOpen, setTraceModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecallWorkOrder | null>(null);
  const [traceData, setTraceData] = useState<TraceabilityNode[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [formData, setFormData] = useState({
    type: 'withdraw' as any,
    productName: '',
    productBatch: '',
    reason: '',
    affectedStores: [] as string[],
    affectedQuantity: 0,
  });

  const [approveData, setApproveData] = useState({
    comment: '',
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get<ApiResponse<PaginationResult<RecallWorkOrder>>>('/recall', { params });
      setRecords(response.data.data.list);
    } catch (err: any) {
      setError(err.message || '加载召回记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [typeFilter, statusFilter]);

  const handleCreate = async () => {
    if (!formData.productName || !formData.reason) return;
    try {
      setSubmitting(true);
      await api.post('/recall', formData);
      setCreateModalOpen(false);
      setFormData({ type: 'withdraw', productName: '', productBatch: '', reason: '', affectedStores: [], affectedQuantity: 0 });
      fetchRecords();
    } catch (err: any) {
      setError(err.message || '创建工单失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = (record: RecallWorkOrder) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const handleViewTrace = async (record: RecallWorkOrder) => {
    try {
      setSelectedRecord(record);
      const response = await api.get<ApiResponse<TraceabilityNode[]>>(`/recall/${record.id}/traceability`);
      setTraceData(response.data.data);
      setTraceModalOpen(true);
    } catch (err: any) {
      setError(err.message || '加载追溯链路失败');
    }
  };

  const handleApprove = async () => {
    if (!selectedRecord) return;
    try {
      setSubmitting(true);
      await api.post(`/recall/${selectedRecord.id}/approve`, approveData);
      setApproveModalOpen(false);
      setApproveData({ comment: '' });
      fetchRecords();
    } catch (err: any) {
      setError(err.message || '审批失败');
    } finally {
      setSubmitting(false);
    }
  };

  const openApproveModal = (record: RecallWorkOrder) => {
    setSelectedRecord(record);
    setApproveData({ comment: '' });
    setApproveModalOpen(true);
  };

  const typeOptions = [
    { value: '', label: '全部类型' },
    { value: 'withdraw', label: '下架' },
    { value: 'recall', label: '召回' },
    { value: 'destruction', label: '销毁' },
  ];

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待审批' },
    { value: 'approved', label: '已批准' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'executing', label: '执行中' },
    { value: 'completed', label: '已完成' },
  ];

  const storeOptions = [
    { value: 's001', label: '上海南京路店' },
    { value: 's002', label: '上海陆家嘴店' },
    { value: 's003', label: '上海徐汇店' },
    { value: 's004', label: '上海静安店' },
    { value: 's005', label: '上海浦东店' },
  ];

  const columns = [
    {
      key: 'id',
      title: '工单编号',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono font-medium text-cyan-400">{value.toUpperCase()}</span>
      ),
    },
    {
      key: 'type',
      title: '类型',
      render: (value: string) => {
        const colors: Record<string, string> = {
          withdraw: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          recall: 'bg-red-500/20 text-red-400 border-red-500/30',
          destruction: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        };
        const labels: Record<string, string> = {
          withdraw: '下架',
          recall: '召回',
          destruction: '销毁',
        };
        return (
          <span className={cn(
            'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border',
            colors[value]
          )}>
            {labels[value]}
          </span>
        );
      },
    },
    {
      key: 'productName',
      title: '涉及产品',
      sortable: true,
      render: (value: string, row: RecallWorkOrder) => (
        <div>
          <p className="text-slate-200 font-medium">{value}</p>
          {row.productBatch && (
            <p className="text-xs text-slate-500 font-mono">批次: {row.productBatch}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: 'approvalProgress',
      title: '审批进度',
      render: (_: any, row: RecallWorkOrder) => {
        const steps = ['提交', '运营审核', '质量审核', '完成'];
        const currentStep = row.status === 'pending' ? 0 
          : row.status === 'pending_approval' ? 1
          : row.status === 'approved_store' ? 2
          : row.status === 'approved_region' ? 2
          : row.status === 'executing' ? 3
          : row.status === 'completed' ? 4 : 0;
        return (
          <div className="flex items-center gap-1">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2',
                  index < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : index === currentStep
                    ? 'bg-cyan-500 border-cyan-500 text-white animate-pulse'
                    : 'bg-slate-800 border-slate-600 text-slate-500'
                )}>
                  {index < currentStep ? <Check size={12} /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'w-8 h-0.5',
                    index < currentStep - 1 ? 'bg-green-500' : 'bg-slate-700'
                  )} />
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      title: '创建时间',
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
      width: 200,
      render: (_: any, row: RecallWorkOrder) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleViewTrace(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-blue-400 transition-colors"
            title="追溯链路"
          >
            <TrendingDown size={16} />
          </button>
          {row.status === 'pending' && (
            <button
              onClick={() => openApproveModal(row)}
              className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors"
              title="审批"
            >
              <Check size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const nodeTypeIcons: Record<string, any> = {
    supplier: Package,
    warehouse: MapPin,
    kitchen: Package,
    store: MapPin,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">下架召回</h1>
            <p className="text-sm text-slate-500">产品下架召回管理与追溯</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 px-4 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          >
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/20 transition-all"
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
          data={records}
          loading={loading}
          rowKey="id"
          emptyText="暂无召回工单"
        />
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-100">创建召回工单</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                  >
                    {typeOptions.filter(o => o.value).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">涉及数量</label>
                  <input
                    type="number"
                    value={formData.affectedQuantity}
                    onChange={(e) => setFormData({ ...formData, affectedQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">产品名称 *</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="请输入产品名称"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">产品批次</label>
                <input
                  type="text"
                  value={formData.productBatch}
                  onChange={(e) => setFormData({ ...formData, productBatch: e.target.value })}
                  placeholder="请输入产品批次号"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">涉及门店</label>
                <div className="grid grid-cols-2 gap-2">
                  {storeOptions.map(store => (
                    <label key={store.value} className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 cursor-pointer hover:bg-slate-800/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.affectedStores.includes(store.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, affectedStores: [...formData.affectedStores, store.value] });
                          } else {
                            setFormData({ ...formData, affectedStores: formData.affectedStores.filter(s => s !== store.value) });
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-red-500 focus:ring-red-500/20"
                      />
                      <span className="text-sm text-slate-300">{store.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">原因 *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="请详细描述下架/召回原因..."
                  rows={4}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !formData.productName.trim() || !formData.reason.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '提交中...' : '创建工单'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-red-400" />
                <h3 className="text-lg font-semibold text-slate-100">工单详情</h3>
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
                  <p className="text-xs text-slate-500 mb-1">工单编号</p>
                  <p className="font-mono font-medium text-cyan-400">{selectedRecord.id.toUpperCase()}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">类型</p>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border',
                    selectedRecord.type === 'withdraw' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                    selectedRecord.type === 'recall' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  )}>
                    {selectedRecord.type === 'withdraw' ? '下架' :
                     selectedRecord.type === 'recall' ? '召回' : '销毁'}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">状态</p>
                  <StatusBadge status={selectedRecord.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">产品名称</p>
                  <p className="font-medium text-slate-200">{selectedRecord.productName}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">产品批次</p>
                  <p className="font-mono text-slate-300">{selectedRecord.productBatch || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">涉及数量</p>
                  <p className="font-semibold text-slate-200">{formatNumber(selectedRecord.affectedQuantity)} 份</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">涉及门店</p>
                  <p className="font-medium text-slate-200">{selectedRecord.affectedStores.length} 家</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-2">原因</p>
                <p className="text-slate-300">{selectedRecord.reason}</p>
              </div>

              {selectedRecord.approvalHistory.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">审批历史</h4>
                  <div className="space-y-2">
                    {selectedRecord.approvalHistory.map((step: any, index: number) => (
                      <div key={index} className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                              <User size={14} className="text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-200">{(step.approver as UserType)?.name}</p>
                              <p className="text-xs text-slate-500">{step.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={step.action} size="sm" />
                            <p className="text-xs text-slate-500 mt-1">{formatDateTime(step.time)}</p>
                          </div>
                        </div>
                        {step.comment && (
                          <p className="text-sm text-slate-400 ml-10">意见: {step.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  handleViewTrace(selectedRecord);
                }}
                className="px-5 py-2.5 rounded-xl text-blue-400 hover:bg-blue-500/10 border border-blue-500/30 transition-colors flex items-center gap-2"
              >
                <TrendingDown size={16} />
                查看追溯
              </button>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                关闭
              </button>
              {selectedRecord.status === 'pending' && (
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    openApproveModal(selectedRecord);
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/20 transition-all flex items-center gap-2"
                >
                  <Check size={16} />
                  审批
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {approveModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">审批工单</h3>
              <button
                onClick={() => setApproveModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">工单</p>
                <p className="font-mono font-medium text-cyan-400">{selectedRecord.id.toUpperCase()}</p>
                <p className="text-sm text-slate-300 mt-1">{selectedRecord.productName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">审批意见</label>
                <textarea
                  value={approveData.comment}
                  onChange={(e) => setApproveData({ comment: e.target.value })}
                  placeholder="请输入审批意见（可选）..."
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
                {submitting ? '提交中...' : '批准'}
              </button>
            </div>
          </div>
        </div>
      )}

      {traceModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <TrendingDown size={20} className="text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-100">追溯链路</h3>
              </div>
              <button
                onClick={() => setTraceModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 mb-6">
                <p className="text-xs text-slate-500 mb-1">追溯产品</p>
                <p className="font-medium text-slate-200">{selectedRecord.productName}</p>
                {selectedRecord.productBatch && (
                  <p className="text-xs text-slate-500 font-mono mt-1">批次: {selectedRecord.productBatch}</p>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />
                <div className="space-y-4">
                  {traceData.map((node, index) => {
                    const IconComponent = nodeTypeIcons[node.type] || Package;
                    return (
                      <div key={node.id} className="relative pl-16">
                        <div className={cn(
                          'absolute left-3 w-7 h-7 rounded-full flex items-center justify-center border-2',
                          node.status === 'affected'
                            ? 'bg-red-500 border-red-500 text-white'
                            : node.status === 'cleared'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-slate-800 border-slate-600 text-slate-400'
                        )}>
                          <IconComponent size={14} />
                        </div>
                        <div className={cn(
                          'p-4 rounded-xl border',
                          node.status === 'affected'
                            ? 'bg-red-500/10 border-red-500/30'
                            : node.status === 'cleared'
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-slate-800/30 border-slate-700/50'
                        )}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-200">{node.name}</p>
                              <p className="text-xs text-slate-500">{node.type === 'supplier' ? '供应商' : node.type === 'warehouse' ? '仓库' : node.type === 'kitchen' ? '中央厨房' : '门店'}</p>
                            </div>
                            <div className="text-right">
                              <StatusBadge status={node.status} size="sm" />
                              <p className="text-xs text-slate-500 mt-1">{formatDateTime(node.timestamp)}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {node.location && (
                              <div>
                                <span className="text-slate-500">位置: </span>
                                <span className="text-slate-300">{node.location}</span>
                              </div>
                            )}
                            {node.quantity !== undefined && (
                              <div>
                                <span className="text-slate-500">数量: </span>
                                <span className="text-slate-300">{formatNumber(node.quantity)}</span>
                              </div>
                            )}
                            {node.batchNo && (
                              <div>
                                <span className="text-slate-500">批次: </span>
                                <span className="text-slate-300 font-mono">{node.batchNo}</span>
                              </div>
                            )}
                            {node.expiryDate && (
                              <div>
                                <span className="text-slate-500">有效期: </span>
                                <span className="text-slate-300">{formatDateTime(node.expiryDate)}</span>
                              </div>
                            )}
                          </div>
                          {node.remark && (
                            <p className="text-sm text-slate-400 mt-2">备注: {node.remark}</p>
                          )}
                        </div>
                        {index < traceData.length - 1 && (
                          <div className="absolute left-6 top-full w-4 h-4 border-l-2 border-b-2 border-slate-600 rounded-bl-lg" style={{ height: '20px' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => setTraceModalOpen(false)}
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
