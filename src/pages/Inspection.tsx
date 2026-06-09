import { useState, useEffect } from 'react';
import { ClipboardCheck, QrCode, AlertTriangle, CheckCircle2, Eye, X, AlertCircle, Clock, FileText } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Loading } from '@/components/Loading';
import { api } from '@/utils/api';
import { formatDateTime, getStatusText } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { InspectionRecord, PaginationResult, InspectionItem, IssueRecord, ApiResponse } from '@/../shared/types';

export default function Inspection() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [checkinData, setCheckinData] = useState({ storeId: '' });
  const [reportData, setReportData] = useState({
    description: '',
    type: 'other' as any,
    severity: 'medium' as any,
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const response = await api.get<ApiResponse<PaginationResult<InspectionRecord>>>('/inspection', { params });
      setRecords(response.data.data.list);
    } catch (err: any) {
      setError(err.message || '加载巡检记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  const handleViewDetail = (record: InspectionRecord) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const handleCheckin = async () => {
    if (!checkinData.storeId) return;
    try {
      setSubmitting(true);
      await api.post('/inspection/checkin', checkinData);
      setCheckinModalOpen(false);
      setCheckinData({ storeId: '' });
      fetchRecords();
    } catch (err: any) {
      setError(err.message || '打卡失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportIssue = async () => {
    if (!selectedRecord || !reportData.description) return;
    try {
      setSubmitting(true);
      await api.post(`/inspection/report-issue`, {
        inspectionId: selectedRecord.id,
        ...reportData,
      });
      setReportModalOpen(false);
      setReportData({ description: '', type: 'other', severity: 'medium' });
      fetchRecords();
    } catch (err: any) {
      setError(err.message || '上报问题失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedRecord) return;
    try {
      setSubmitting(true);
      await api.post(`/inspection/checkout`, { inspectionId: selectedRecord.id });
      setCheckoutModalOpen(false);
      fetchRecords();
    } catch (err: any) {
      setError(err.message || '完成巡检失败');
    } finally {
      setSubmitting(false);
    }
  };

  const openReportModal = (record: InspectionRecord) => {
    setSelectedRecord(record);
    setReportData({ description: '', type: 'other', severity: 'medium' });
    setReportModalOpen(true);
  };

  const openCheckoutModal = (record: InspectionRecord) => {
    setSelectedRecord(record);
    setCheckoutModalOpen(true);
  };

  const severityColors: Record<string, string> = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const columns = [
    {
      key: 'id',
      title: '巡检编号',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono font-medium text-cyan-400">{value.toUpperCase()}</span>
      ),
    },
    {
      key: 'storeName',
      title: '门店',
      sortable: true,
      render: (value: string) => <span className="text-slate-200">{value}</span>,
    },
    {
      key: 'inspectorName',
      title: '巡检员',
      render: (value: string) => <span className="text-slate-300">{value}</span>,
    },
    {
      key: 'checkInTime',
      title: '打卡时间',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1 text-slate-300">
          <Clock size={14} className="text-slate-500" />
          {formatDateTime(value)}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: 'issues',
      title: '问题数',
      align: 'center' as const,
      render: (value: IssueRecord[]) => (
        <span className={cn(
          'font-mono font-semibold',
          value.length > 0 ? 'text-red-400' : 'text-green-400'
        )}>
          {value.length}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      render: (_: any, row: InspectionRecord) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
          {row.status === 'in_progress' && (
            <>
              <button
                onClick={() => openReportModal(row)}
                className="p-1.5 rounded-lg hover:bg-orange-500/20 text-slate-400 hover:text-orange-400 transition-colors"
                title="上报问题"
              >
                <AlertTriangle size={16} />
              </button>
              <button
                onClick={() => openCheckoutModal(row)}
                className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors"
                title="完成巡检"
              >
                <CheckCircle2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'in_progress', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'issue_found', label: '发现问题' },
  ];

  const typeOptions = [
    { value: 'expired', label: '过期食品' },
    { value: 'deteriorated', label: '变质' },
    { value: 'hygiene', label: '卫生问题' },
    { value: 'temperature', label: '温度异常' },
    { value: 'other', label: '其他' },
  ];

  const severityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'critical', label: '严重' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ClipboardCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">食安巡检</h1>
            <p className="text-sm text-slate-500">食品安全巡检，问题上报与整改</p>
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
            onClick={() => setCheckinModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
          >
            <QrCode size={18} />
            扫码打卡
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
          emptyText="暂无巡检记录"
        />
      )}

      {detailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-emerald-400" />
                <h3 className="text-lg font-semibold text-slate-100">巡检详情</h3>
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
                  <p className="text-xs text-slate-500 mb-1">巡检编号</p>
                  <p className="font-mono font-medium text-cyan-400">{selectedRecord.id.toUpperCase()}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">门店</p>
                  <p className="font-medium text-slate-200">{selectedRecord.storeName}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">状态</p>
                  <StatusBadge status={selectedRecord.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">巡检员</p>
                  <p className="text-slate-200">{selectedRecord.inspectorName}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">打卡时间</p>
                  <p className="text-slate-300">{formatDateTime(selectedRecord.checkInTime)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-200 mb-3">检查项目</h4>
                <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800/50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase">检查项</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase">类别</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-400 uppercase">结果</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase">备注</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {selectedRecord.items.map((item: InspectionItem) => (
                        <tr key={item.id} className="hover:bg-slate-800/20">
                          <td className="px-4 py-3 text-sm text-slate-300">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{item.category}</td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={item.result} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">{item.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedRecord.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-200 mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-400" />
                    发现问题 ({selectedRecord.issues.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedRecord.issues.map((issue: IssueRecord) => (
                      <div key={issue.id} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
                              severityColors[issue.severity]
                            )}>
                              {getStatusText(issue.severity)}
                            </span>
                            <span className="text-xs text-slate-500">{getStatusText(issue.type)}</span>
                          </div>
                          <span className="text-xs text-slate-500">{formatDateTime(issue.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-300">{issue.description}</p>
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
              {selectedRecord.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      openReportModal(selectedRecord);
                    }}
                    className="px-5 py-2.5 rounded-xl text-orange-400 hover:bg-orange-500/10 border border-orange-500/30 transition-colors"
                  >
                    上报问题
                  </button>
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      openCheckoutModal(selectedRecord);
                    }}
                    className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/20 transition-all"
                  >
                    完成巡检
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {checkinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">扫码打卡</h3>
              <button
                onClick={() => setCheckinModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 flex flex-col items-center">
                <QrCode size={80} className="text-cyan-400 mb-4" />
                <p className="text-slate-400 text-sm">扫描门店二维码进行打卡</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">或手动选择门店</label>
                <select
                  value={checkinData.storeId}
                  onChange={(e) => setCheckinData({ storeId: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value="">请选择门店</option>
                  <option value="s001">上海南京路店</option>
                  <option value="s002">上海陆家嘴店</option>
                  <option value="s003">上海徐汇店</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setCheckinModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCheckin}
                disabled={submitting || !checkinData.storeId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '打卡中...' : '确认打卡'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">上报问题</h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">巡检</p>
                <p className="font-medium text-slate-200">{selectedRecord.storeName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">问题描述</label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                  placeholder="请详细描述发现的问题..."
                  rows={4}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">问题类型</label>
                  <select
                    value={reportData.type}
                    onChange={(e) => setReportData({ ...reportData, type: e.target.value as any })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">严重程度</label>
                  <select
                    value={reportData.severity}
                    onChange={(e) => setReportData({ ...reportData, severity: e.target.value as any })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  >
                    {severityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReportIssue}
                disabled={submitting || !reportData.description.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '提交中...' : '提交上报'}
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">完成巡检</h3>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle2 size={18} />
                  <span className="font-medium">确认完成巡检</span>
                </div>
                <p className="text-sm text-slate-400">
                  门店: <span className="text-slate-200">{selectedRecord.storeName}</span>
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  已检查 <span className="text-cyan-400 font-medium">{selectedRecord.items.length}</span> 项，
                  发现问题 <span className={cn('font-medium', selectedRecord.issues.length > 0 ? 'text-red-400' : 'text-green-400')}>
                    {selectedRecord.issues.length}
                  </span> 个
                </p>
              </div>
              {selectedRecord.issues.length > 0 && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                  <p className="text-sm text-orange-400 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    存在未处理问题，将自动生成整改工单
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '提交中...' : '确认完成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
