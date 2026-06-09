import { useState, useEffect } from 'react';
import { Wallet, Eye, Search, X, AlertCircle, Clock, FileText, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Loading } from '@/components/Loading';
import { api } from '@/utils/api';
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { DailyTransaction, PaginationResult, ReconciliationRecord, CostDetailItem, ApiResponse } from '@/../shared/types';

export default function Finance() {
  const [transactions, setTransactions] = useState<DailyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [reconciliationModalOpen, setReconciliationModalOpen] = useState(false);
  const [investigateModalOpen, setInvestigateModalOpen] = useState(false);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<DailyTransaction | null>(null);
  const [reconciliationData, setReconciliationData] = useState<ReconciliationRecord[]>([]);
  const [costData, setCostData] = useState<CostDetailItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'reconciliation'>('transactions');

  const [investigateData, setInvestigateData] = useState({
    reason: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get<ApiResponse<PaginationResult<DailyTransaction>>>('/finance/transactions', { params });
      setTransactions(response.data.data.list);
    } catch (err: any) {
      setError(err.message || '加载流水数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliation = async () => {
    try {
      const response = await api.get<ApiResponse<PaginationResult<ReconciliationRecord>>>('/finance/reconciliation');
      setReconciliationData(response.data.data.list);
    } catch (err: any) {
      setError(err.message || '加载对账数据失败');
    }
  };

  const fetchCostDetails = async (transactionId: string) => {
    try {
      const response = await api.get<ApiResponse<CostDetailItem[]>>(`/finance/cost-details`, {
        params: { transactionId },
      });
      setCostData(response.data.data);
      setCostModalOpen(true);
    } catch (err: any) {
      setError(err.message || '加载成本明细失败');
    }
  };

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    } else {
      fetchReconciliation();
    }
  }, [activeTab, dateRange, statusFilter]);

  const handleViewDetail = (record: DailyTransaction) => {
    setSelectedTransaction(record);
    setDetailModalOpen(true);
  };

  const handleInvestigate = async () => {
    if (!selectedTransaction || !investigateData.reason) return;
    try {
      setSubmitting(true);
      await api.post(`/finance/reconciliation/${selectedTransaction.id}/investigate`, investigateData);
      setInvestigateModalOpen(false);
      setInvestigateData({ reason: '', priority: 'normal' });
      fetchReconciliation();
    } catch (err: any) {
      setError(err.message || '触发核查失败');
    } finally {
      setSubmitting(false);
    }
  };

  const openInvestigateModal = (record: DailyTransaction) => {
    setSelectedTransaction(record);
    setInvestigateData({ reason: '', priority: 'normal' });
    setInvestigateModalOpen(true);
  };

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'reconciled', label: '已对账' },
    { value: 'unreconciled', label: '未对账' },
    { value: 'discrepancy', label: '存在差异' },
    { value: 'investigating', label: '核查中' },
  ];

  const priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'normal', label: '普通' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' },
  ];

  const transactionColumns = [
    {
      key: 'date',
      title: '日期',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1 text-slate-300">
          <Clock size={14} className="text-slate-500" />
          {formatDate(value)}
        </div>
      ),
    },
    {
      key: 'totalRevenue',
      title: '营收',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono font-semibold text-green-400">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'cost',
      title: '成本',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono font-semibold text-red-400">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'profit',
      title: '利润',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1">
          {value >= 0 ? (
            <TrendingUp size={14} className="text-green-400" />
          ) : (
            <TrendingDown size={14} className="text-red-400" />
          )}
          <span className={cn(
            'font-mono font-semibold',
            value >= 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {formatCurrency(value)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      title: '对账状态',
      render: (value: string) => {
        const colors: Record<string, string> = {
          reconciled: 'bg-green-500/20 text-green-400 border-green-500/30',
          unreconciled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
          discrepancy: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          investigating: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        };
        const labels: Record<string, string> = {
          reconciled: '已对账',
          unreconciled: '未对账',
          discrepancy: '存在差异',
          investigating: '核查中',
        };
        const icons: Record<string, any> = {
          reconciled: CheckCircle,
          unreconciled: Clock,
          discrepancy: AlertTriangle,
          investigating: Search,
        };
        const Icon = icons[value] || Clock;
        return (
          <span className={cn(
            'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border gap-1',
            colors[value]
          )}>
            <Icon size={12} />
            {labels[value]}
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: 200,
      render: (_: any, row: DailyTransaction) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => fetchCostDetails(row.id)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-blue-400 transition-colors"
            title="成本明细"
          >
            <FileText size={16} />
          </button>
          {(row.status === 'discrepancy' || row.status === 'mismatch' || row.status === 'investigating') && (
            <button
              onClick={() => openInvestigateModal(row)}
              className="p-1.5 rounded-lg hover:bg-orange-500/20 text-slate-400 hover:text-orange-400 transition-colors"
              title="触发核查"
            >
              <Search size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const reconciliationColumns = [
    {
      key: 'id',
      title: '对账编号',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono font-medium text-cyan-400">{value.toUpperCase()}</span>
      ),
    },
    {
      key: 'date',
      title: '日期',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'expectedAmount',
      title: '系统金额',
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono text-slate-300">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'actualAmount',
      title: '银行金额',
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono text-slate-300">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'difference',
      title: '差额',
      align: 'right' as const,
      render: (value: number) => (
        <span className={cn(
          'font-mono font-semibold',
          value === 0 ? 'text-green-400' : 'text-red-400'
        )}>
          {value === 0 ? '-' : formatCurrency(value)}
        </span>
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
      width: 160,
      render: (_: any, row: ReconciliationRecord) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const transaction = transactions.find(t => t.id === row.transactionId);
              if (transaction) handleViewDetail(transaction);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
          {(row.status === 'discrepancy' || row.status === 'mismatch') && (
            <button
              onClick={() => {
                const transaction = transactions.find(t => t.id === row.transactionId);
                if (transaction) openInvestigateModal(transaction);
              }}
              className="p-1.5 rounded-lg hover:bg-orange-500/20 text-slate-400 hover:text-orange-400 transition-colors"
              title="触发核查"
            >
              <Search size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const summaryData = transactions.reduce((acc, t) => ({
    totalRevenue: acc.totalRevenue + t.totalRevenue,
    totalCost: acc.totalCost + t.cost,
    totalProfit: acc.totalProfit + t.profit,
  }), { totalRevenue: 0, totalCost: 0, totalProfit: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">财务中心</h1>
            <p className="text-sm text-slate-500">每日流水、对账管理、成本明细</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle size={14} className="text-amber-400" />
          <span className="text-xs font-medium text-amber-400">L4 权限</span>
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

      <div className="grid grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">总营收</span>
            <TrendingUp size={16} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(summaryData.totalRevenue)}</p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">总成本</span>
            <TrendingDown size={16} className="text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(summaryData.totalCost)}</p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">总利润</span>
            {summaryData.totalProfit >= 0 ? (
              <TrendingUp size={16} className="text-cyan-400" />
            ) : (
              <TrendingDown size={16} className="text-red-400" />
            )}
          </div>
          <p className={cn(
            'text-2xl font-bold',
            summaryData.totalProfit >= 0 ? 'text-cyan-400' : 'text-red-400'
          )}>
            {formatCurrency(summaryData.totalProfit)}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">利润率</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {summaryData.totalRevenue > 0
              ? ((summaryData.totalProfit / summaryData.totalRevenue) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('transactions')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'transactions'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            每日流水
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'reconciliation'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            对账管理
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            <span className="text-slate-500">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          {activeTab === 'transactions' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 px-4 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              if (activeTab === 'transactions') {
                fetchTransactions();
              } else {
                fetchReconciliation();
              }
            }}
            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <Loading text="加载中..." />
      ) : activeTab === 'transactions' ? (
        <DataTable
          columns={transactionColumns}
          data={transactions}
          loading={loading}
          rowKey="id"
          emptyText="暂无流水数据"
        />
      ) : (
        <DataTable
          columns={reconciliationColumns}
          data={reconciliationData}
          loading={loading}
          rowKey="id"
          emptyText="暂无对账数据"
        />
      )}

      {detailModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-emerald-400" />
                <h3 className="text-lg font-semibold text-slate-100">流水详情</h3>
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
                  <p className="text-xs text-slate-500 mb-1">日期</p>
                  <p className="font-medium text-slate-200">{formatDate(selectedTransaction.date)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">交易笔数</p>
                  <p className="font-mono font-semibold text-cyan-400">{formatNumber(selectedTransaction.orderCount)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">对账状态</p>
                  <StatusBadge status={selectedTransaction.status} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-slate-500 mb-1">营收</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(selectedTransaction.totalRevenue)}</p>
                </div>
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-xs text-slate-500 mb-1">成本</p>
                  <p className="text-2xl font-bold text-red-400">{formatCurrency(selectedTransaction.cost)}</p>
                </div>
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-xs text-slate-500 mb-1">利润</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    selectedTransaction.profit >= 0 ? 'text-cyan-400' : 'text-red-400'
                  )}>
                    {formatCurrency(selectedTransaction.profit)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-200 mb-3">营收构成</h4>
                <div className="space-y-3">
                  {selectedTransaction.revenueBreakdown?.map((item: any, index: number) => (
                    <div key={index} className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300">{item.category}</span>
                        <span className="font-mono font-medium text-green-400">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          style={{ width: `${(item.amount / selectedTransaction.totalRevenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-200 mb-3">成本构成</h4>
                <div className="space-y-3">
                  {selectedTransaction.costBreakdown?.map((item: any, index: number) => (
                    <div key={index} className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300">{item.category}</span>
                        <span className="font-mono font-medium text-red-400">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full"
                          style={{ width: `${(item.amount / selectedTransaction.cost) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  fetchCostDetails(selectedTransaction.id);
                }}
                className="px-5 py-2.5 rounded-xl text-blue-400 hover:bg-blue-500/10 border border-blue-500/30 transition-colors flex items-center gap-2"
              >
                <FileText size={16} />
                成本明细
              </button>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                关闭
              </button>
              {(selectedTransaction.status === 'discrepancy' || selectedTransaction.status === 'mismatch' || selectedTransaction.status === 'investigating') && (
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    openInvestigateModal(selectedTransaction);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all"
                >
                  <Search size={16} />
                  触发核查
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {costModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-100">成本明细</h3>
              </div>
              <button
                onClick={() => setCostModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">类别</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">项目</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">金额</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">占比</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {costData.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-800/20">
                      <td className="px-4 py-3 text-sm text-slate-300">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-slate-200">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-red-400">{formatCurrency(item.actual)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                              style={{ width: `${Math.abs(item.variancePercent)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{Math.abs(item.variancePercent)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{item.variance > 0 ? '超支' : item.variance < 0 ? '节约' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => setCostModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {investigateModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">触发财务核查</h3>
              <button
                onClick={() => setInvestigateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">核查日期</p>
                <p className="font-medium text-slate-200">{formatDate(selectedTransaction.date)}</p>
                {(selectedTransaction.status === 'discrepancy' || selectedTransaction.status === 'mismatch') && (
                  <p className="text-sm text-red-400 mt-1">存在对账差异</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">核查原因 *</label>
                <textarea
                  value={investigateData.reason}
                  onChange={(e) => setInvestigateData({ ...investigateData, reason: e.target.value })}
                  placeholder="请详细描述核查原因..."
                  rows={4}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">优先级</label>
                <div className="grid grid-cols-4 gap-2">
                  {priorityOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setInvestigateData({ ...investigateData, priority: opt.value as any })}
                      className={cn(
                        'p-2 rounded-lg border text-sm font-medium transition-all',
                        investigateData.priority === opt.value
                          ? opt.value === 'urgent' ? 'bg-red-500/20 border-red-500/30 text-red-400'
                            : opt.value === 'high' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                            : opt.value === 'normal' ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                            : 'bg-green-500/20 border-green-500/30 text-green-400'
                          : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/50'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setInvestigateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleInvestigate}
                disabled={submitting || !investigateData.reason.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '提交中...' : '确认核查'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
