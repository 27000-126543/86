import { useState, useEffect } from 'react';
import { Users, Eye, Gift, TrendingUp, X, AlertCircle, Clock, FileText, CreditCard, Star, ShoppingBag, Heart } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Loading } from '@/components/Loading';
import { api } from '@/utils/api';
import { formatCurrency, formatNumber, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Member, PaginationResult, Coupon, MemberLevel, MemberLevelHistory, ApiResponse } from '@/../shared/types';

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [levelModalOpen, setLevelModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [couponData, setCouponData] = useState({
    couponId: '',
    message: '',
  });

  const [levelData, setLevelData] = useState({
    memberIds: [] as string[],
    action: 'upgrade' as 'upgrade' | 'downgrade',
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (levelFilter) params.level = levelFilter;
      const response = await api.get<ApiResponse<PaginationResult<Member>>>('/members', { params });
      setMembers(response.data.data.list);
    } catch (err: any) {
      setError(err.message || '加载会员列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [levelFilter]);

  const handleViewDetail = async (member: Member) => {
    try {
      const response = await api.get<ApiResponse<Member>>(`/members/${member.id}`);
      setSelectedMember(response.data.data);
      setDetailModalOpen(true);
    } catch (err: any) {
      setError(err.message || '加载会员详情失败');
    }
  };

  const handleSendCoupon = async () => {
    if (!selectedMember || !couponData.couponId) return;
    try {
      setSubmitting(true);
      await api.post(`/members/${selectedMember.id}/send-coupon`, couponData);
      setCouponModalOpen(false);
      setCouponData({ couponId: '', message: '' });
      fetchMembers();
    } catch (err: any) {
      setError(err.message || '发送优惠券失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessLevels = async () => {
    if (levelData.memberIds.length === 0) return;
    try {
      setSubmitting(true);
      await api.post('/members/process-levels', levelData);
      setLevelModalOpen(false);
      setLevelData({ memberIds: [], action: 'upgrade' });
      setSelectedIds([]);
      fetchMembers();
    } catch (err: any) {
      setError(err.message || '处理升降级失败');
    } finally {
      setSubmitting(false);
    }
  };

  const openCouponModal = (member: Member) => {
    setSelectedMember(member);
    setCouponData({ couponId: '', message: '' });
    setCouponModalOpen(true);
  };

  const openLevelModal = () => {
    setLevelData({ memberIds: selectedIds, action: 'upgrade' });
    setLevelModalOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map(m => m.id));
    }
  };

  const levelOptions = [
    { value: '', label: '全部等级' },
    { value: 'bronze', label: '青铜会员' },
    { value: 'silver', label: '白银会员' },
    { value: 'gold', label: '黄金会员' },
    { value: 'platinum', label: '铂金会员' },
    { value: 'diamond', label: '钻石会员' },
  ];

  const levelColors: Record<string, string> = {
    bronze: 'bg-amber-700/20 text-amber-500 border-amber-500/30',
    silver: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
    gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    platinum: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    diamond: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  const couponOptions = [
    { value: 'c001', label: '满100减20优惠券' },
    { value: 'c002', label: '满200减50优惠券' },
    { value: 'c003', label: '新用户专享8折券' },
    { value: 'c004', label: '生日专属50元券' },
  ];

  const columns = [
    {
      key: 'select',
      title: '',
      width: 40,
      align: 'center' as const,
      render: (_: any, row: Member) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelect(row.id)}
          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/20"
        />
      ),
    },
    {
      key: 'cardNumber',
      title: '会员卡号',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono font-medium text-cyan-400">{value}</span>
      ),
    },
    {
      key: 'name',
      title: '姓名',
      sortable: true,
      render: (value: string, row: Member) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">{value.charAt(0)}</span>
          </div>
          <div>
            <p className="text-slate-200 font-medium">{value}</p>
            <p className="text-xs text-slate-500">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'level',
      title: '等级',
      render: (value: string) => {
        const labels: Record<string, string> = {
          bronze: '青铜',
          silver: '白银',
          gold: '黄金',
          platinum: '铂金',
          diamond: '钻石',
        };
        return (
          <span className={cn(
            'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border',
            levelColors[value]
          )}>
            <Star size={12} className="mr-1" />
            {labels[value]}
          </span>
        );
      },
    },
    {
      key: 'points',
      title: '积分',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono font-semibold text-yellow-400">{formatNumber(value)}</span>
      ),
    },
    {
      key: 'visitCount',
      title: '消费频次',
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex items-center justify-center gap-1">
          <ShoppingBag size={14} className="text-slate-500" />
          <span className="text-slate-300">{value} 次</span>
        </div>
      ),
    },
    {
      key: 'preferences',
      title: '偏好',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 3).map((pref, index) => (
            <span key={index} className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-slate-800/50 text-slate-400 border border-slate-700/50">
              <Heart size={10} className="mr-1 text-rose-400" />
              {pref}
            </span>
          ))}
          {value.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-slate-800/50 text-slate-500 border border-slate-700/50">
              +{value.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 160,
      render: (_: any, row: Member) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => openCouponModal(row)}
            className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-400 transition-colors"
            title="推送优惠券"
          >
            <Gift size={16} />
          </button>
          <button
            onClick={() => toggleSelect(row.id)}
            className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors"
            title="升降级"
          >
            <TrendingUp size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">会员管理</h1>
            <p className="text-sm text-slate-500">会员信息管理与权益发放</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 px-4 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          >
            {levelOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={openLevelModal}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp size={18} />
            处理升降级 {selectedIds.length > 0 && `(${selectedIds.length})`}
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
        <div>
          {selectedIds.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
              <span className="text-cyan-400 text-sm">已选择 {selectedIds.length} 位会员</span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                取消选择
              </button>
            </div>
          )}
          <div className="mb-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.length === members.length && members.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/20"
            />
            <span className="text-sm text-slate-400">全选</span>
          </div>
          <DataTable
            columns={columns}
            data={members}
            loading={loading}
            rowKey="id"
            emptyText="暂无会员数据"
          />
        </div>
      )}

      {detailModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-purple-400" />
                <h3 className="text-lg font-semibold text-slate-100">会员详情</h3>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{selectedMember.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-xl font-bold text-slate-100">{selectedMember.name}</h4>
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border',
                        levelColors[selectedMember.level]
                      )}>
                        <Star size={12} className="mr-1" />
                        {selectedMember.level === 'bronze' ? '青铜' :
                         selectedMember.level === 'silver' ? '白银' :
                         selectedMember.level === 'gold' ? '黄金' :
                         selectedMember.level === 'platinum' ? '铂金' : '钻石'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <CreditCard size={14} />
                        {selectedMember.cardNumber}
                      </span>
                      <span>{selectedMember.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-yellow-400">{formatNumber(selectedMember.points)}</p>
                    <p className="text-xs text-slate-500">积分</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                  <p className="text-2xl font-bold text-cyan-400">{selectedMember.visitCount}</p>
                  <p className="text-xs text-slate-500 mt-1">消费次数</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(selectedMember.totalSpent)}</p>
                  <p className="text-xs text-slate-500 mt-1">累计消费</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                  <p className="text-2xl font-bold text-purple-400">{selectedMember.coupons.length}</p>
                  <p className="text-xs text-slate-500 mt-1">可用优惠券</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                  <p className="text-2xl font-bold text-orange-400">{formatDateTime(selectedMember.joinDate).split(' ')[0]}</p>
                  <p className="text-xs text-slate-500 mt-1">注册日期</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">消费偏好</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.preferences.map((pref, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1.5 text-sm rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50">
                        <Heart size={12} className="mr-1.5 text-rose-400" />
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">会员标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.tags?.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1.5 text-sm rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        {tag}
                      </span>
                    )) || <span className="text-slate-500 text-sm">暂无标签</span>}
                  </div>
                </div>
              </div>

              {selectedMember.coupons.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">可用优惠券</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedMember.coupons.map((coupon: Coupon) => (
                      <div key={coupon.id} className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-yellow-400">{coupon.name}</p>
                            <p className="text-xs text-slate-400 mt-1">满{coupon.minAmount}减{coupon.discountAmount}</p>
                          </div>
                          <span className="text-lg font-bold text-yellow-400">¥{coupon.discountAmount}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-yellow-500/20">
                          <span className="text-xs text-slate-500">有效期至 {formatDateTime(coupon.expireDate).split(' ')[0]}</span>
                          <StatusBadge status={coupon.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMember.levelHistory && selectedMember.levelHistory.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">等级变更记录</h4>
                  <div className="space-y-2">
                    {selectedMember.levelHistory.map((record: MemberLevelHistory, index: number) => (
                      <div key={index} className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
                            levelColors[record.fromLevel]
                          )}>
                            {record.fromLevel === 'bronze' ? '青铜' :
                             record.fromLevel === 'silver' ? '白银' :
                             record.fromLevel === 'gold' ? '黄金' :
                             record.fromLevel === 'platinum' ? '铂金' : '钻石'}
                          </span>
                          <TrendingUp size={14} className={record.action === 'upgrade' ? 'text-green-400' : 'text-red-400'} />
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
                            levelColors[record.toLevel]
                          )}>
                            {record.toLevel === 'bronze' ? '青铜' :
                             record.toLevel === 'silver' ? '白银' :
                             record.toLevel === 'gold' ? '黄金' :
                             record.toLevel === 'platinum' ? '铂金' : '钻石'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{formatDateTime(record.effectiveDate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20 flex-shrink-0">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  openCouponModal(selectedMember);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:shadow-lg hover:shadow-yellow-500/20 transition-all"
              >
                <Gift size={16} />
                推送优惠券
              </button>
            </div>
          </div>
        </div>
      )}

      {couponModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">推送优惠券</h3>
              <button
                onClick={() => setCouponModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">发送至</p>
                <p className="font-medium text-slate-200">{selectedMember.name} ({selectedMember.cardNumber})</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">选择优惠券 *</label>
                <select
                  value={couponData.couponId}
                  onChange={(e) => setCouponData({ ...couponData, couponId: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="">请选择优惠券</option>
                  {couponOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">推送消息</label>
                <textarea
                  value={couponData.message}
                  onChange={(e) => setCouponData({ ...couponData, message: e.target.value })}
                  placeholder="请输入推送消息（可选）..."
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setCouponModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSendCoupon}
                disabled={submitting || !couponData.couponId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '发送中...' : '确认发送'}
              </button>
            </div>
          </div>
        </div>
      )}

      {levelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">处理会员升降级</h3>
              <button
                onClick={() => setLevelModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">已选择会员</p>
                <p className="font-medium text-slate-200">{levelData.memberIds.length} 位</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">操作类型</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLevelData({ ...levelData, action: 'upgrade' })}
                    className={cn(
                      'p-4 rounded-xl border transition-all text-center',
                      levelData.action === 'upgrade'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/50'
                    )}
                  >
                    <TrendingUp size={24} className="mx-auto mb-2" />
                    <p className="font-medium">升级</p>
                  </button>
                  <button
                    onClick={() => setLevelData({ ...levelData, action: 'downgrade' })}
                    className={cn(
                      'p-4 rounded-xl border transition-all text-center',
                      levelData.action === 'downgrade'
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                        : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/50'
                    )}
                  >
                    <TrendingUp size={24} className="mx-auto mb-2 rotate-180" />
                    <p className="font-medium">降级</p>
                  </button>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm text-yellow-400 flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>
                    {levelData.action === 'upgrade'
                      ? '将为选中的会员执行升级操作，升级后会员将享受更高等级权益。'
                      : '将为选中的会员执行降级操作，降级后会员权益将相应调整。'}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => setLevelModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleProcessLevels}
                disabled={submitting || levelData.memberIds.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '处理中...' : `确认${levelData.action === 'upgrade' ? '升级' : '降级'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
