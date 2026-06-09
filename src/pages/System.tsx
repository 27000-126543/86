import { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Eye, X, AlertCircle, FileText, User, Shield, Clock, Check } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Loading } from '@/components/Loading';
import { api } from '@/utils/api';
import { formatDateTime, getStatusText } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { User as UserType, PaginationResult, ApprovalRule, ApiResponse } from '@/../shared/types';

export default function System() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'rules'>('users');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedRule, setSelectedRule] = useState<ApprovalRule | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [userForm, setUserForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'employee' as any,
    level: 1,
    storeId: '',
    department: '',
    password: '',
  });

  const [ruleForm, setRuleForm] = useState({
    type: 'purchase' as any,
    name: '',
    minAmount: 0,
    maxAmount: 0,
    levels: [1] as number[],
    description: '',
    enabled: true,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<PaginationResult<UserType>>>('/users');
      setUsers(response.data.data.list);
    } catch (err: any) {
      setError(err.message || '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<ApprovalRule[]>>('/approval-rules');
      setRules(response.data.data);
    } catch (err: any) {
      setError(err.message || '加载审批规则失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchRules();
    }
  }, [activeTab]);

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.phone) return;
    try {
      setSubmitting(true);
      await api.post('/users', userForm);
      setUserModalOpen(false);
      resetUserForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.message || '创建用户失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !userForm.name || !userForm.phone) return;
    try {
      setSubmitting(true);
      await api.put(`/users/${selectedUser.id}`, userForm);
      setUserModalOpen(false);
      resetUserForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.message || '更新用户失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRule = async () => {
    if (!ruleForm.name || ruleForm.levels.length === 0) return;
    try {
      setSubmitting(true);
      await api.put('/approval-rules', {
        rules: rules.map(r =>
          r.id === selectedRule?.id
            ? { ...r, ...ruleForm }
            : r
        ),
      });
      setRuleModalOpen(false);
      resetRuleForm();
      fetchRules();
    } catch (err: any) {
      setError(err.message || '更新规则失败');
    } finally {
      setSubmitting(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({
      name: '',
      phone: '',
      email: '',
      role: 'employee',
      level: 1,
      storeId: '',
      department: '',
      password: '',
    });
    setSelectedUser(null);
  };

  const resetRuleForm = () => {
    setRuleForm({
      type: 'purchase',
      name: '',
      minAmount: 0,
      maxAmount: 0,
      levels: [1],
      description: '',
      enabled: true,
    });
    setSelectedRule(null);
  };

  const openCreateUserModal = () => {
    resetUserForm();
    setUserModalOpen(true);
  };

  const openEditUserModal = (user: UserType) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      phone: user.phone,
      email: user.email || '',
      role: user.role,
      level: user.level,
      storeId: user.storeId || '',
      department: user.department || '',
      password: '',
    });
    setUserModalOpen(true);
  };

  const openEditRuleModal = (rule: ApprovalRule) => {
    setSelectedRule(rule);
    setRuleForm({
      type: rule.type,
      name: rule.name,
      minAmount: rule.minAmount,
      maxAmount: rule.maxAmount,
      levels: rule.levels,
      description: rule.description || '',
      enabled: rule.enabled,
    });
    setRuleModalOpen(true);
  };

  const toggleLevel = (level: number) => {
    setRuleForm(prev => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...prev.levels, level].sort((a, b) => a - b),
    }));
  };

  const roleOptions = [
    { value: 'super_admin', label: '超级管理员' },
    { value: 'admin', label: '管理员' },
    { value: 'manager', label: '经理' },
    { value: 'supervisor', label: '主管' },
    { value: 'employee', label: '员工' },
  ];

  const storeOptions = [
    { value: '', label: '不分配' },
    { value: 's001', label: '上海南京路店' },
    { value: 's002', label: '上海陆家嘴店' },
    { value: 's003', label: '上海徐汇店' },
  ];

  const typeOptions = [
    { value: 'purchase', label: '采购审批' },
    { value: 'recall', label: '召回审批' },
    { value: 'maintenance', label: '维修审批' },
    { value: 'cost', label: '费用审批' },
  ];

  const levelLabels: Record<number, string> = {
    1: 'L1 员工',
    2: 'L2 主管',
    3: 'L3 经理',
    4: 'L4 总监',
    5: 'L5 总裁',
  };

  const userColumns = [
    {
      key: 'id',
      title: '用户ID',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono font-medium text-cyan-400">{value.toUpperCase()}</span>
      ),
    },
    {
      key: 'name',
      title: '姓名',
      sortable: true,
      render: (value: string, row: UserType) => (
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
      key: 'role',
      title: '角色',
      render: (value: string) => {
        const labels: Record<string, string> = {
          super_admin: '超级管理员',
          admin: '管理员',
          manager: '经理',
          supervisor: '主管',
          employee: '员工',
        };
        const colors: Record<string, string> = {
          super_admin: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          supervisor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          employee: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
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
      key: 'level',
      title: '权限级别',
      align: 'center' as const,
      render: (value: string | number | undefined) => {
        const level = Number(value) || 0;
        return (
          <div className="flex items-center justify-center gap-1">
            <Shield size={14} className={cn(
              level >= 4 ? 'text-rose-400' :
              level >= 3 ? 'text-purple-400' :
              level >= 2 ? 'text-cyan-400' : 'text-slate-400'
            )} />
            <span className="font-mono font-medium text-slate-300">L{level}</span>
          </div>
        );
      },
    },
    {
      key: 'department',
      title: '部门',
      render: (value: string) => (
        <span className="text-slate-300">{value || '-'}</span>
      ),
    },
    {
      key: 'storeName',
      title: '所属门店',
      render: (value: string) => (
        <span className="text-slate-300">{value || '总部'}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (value: string) => <StatusBadge status={value} />,
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
      width: 120,
      render: (_: any, row: UserType) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditUserModal(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="编辑"
          >
            <Edit2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const ruleColumns = [
    {
      key: 'type',
      title: '类型',
      render: (value: string) => {
        const labels: Record<string, string> = {
          purchase: '采购审批',
          recall: '召回审批',
          maintenance: '维修审批',
          cost: '费用审批',
        };
        const colors: Record<string, string> = {
          purchase: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          recall: 'bg-red-500/20 text-red-400 border-red-500/30',
          maintenance: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          cost: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
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
      key: 'name',
      title: '规则名称',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-slate-200">{value}</span>
      ),
    },
    {
      key: 'amountRange',
      title: '金额范围',
      render: (_: any, row: ApprovalRule) => (
        <span className="font-mono text-slate-300">
          {row.minAmount === 0 ? '0' : row.minAmount} - {row.maxAmount === 0 ? '∞' : row.maxAmount} 元
        </span>
      ),
    },
    {
      key: 'levels',
      title: '审批层级',
      render: (value: number[]) => (
        <div className="flex items-center gap-1">
          {value.map((level, index) => (
            <div key={index} className="flex items-center">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2',
                level >= 4 ? 'bg-rose-500/20 border-rose-500 text-rose-400' :
                level >= 3 ? 'bg-purple-500/20 border-purple-500 text-purple-400' :
                level >= 2 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' :
                'bg-slate-500/20 border-slate-500 text-slate-400'
              )}>
                L{level}
              </div>
              {index < value.length - 1 && (
                <div className="w-2 h-0.5 bg-slate-600 mx-0.5" />
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'enabled',
      title: '状态',
      render: (value: boolean) => (
        <span className={cn(
          'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border gap-1',
          value
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        )}>
          {value ? <Check size={12} /> : <X size={12} />}
          {value ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      key: 'description',
      title: '描述',
      render: (value: string) => (
        <span className="text-slate-400 text-sm">{value || '-'}</span>
      ),
    },
    {
      key: 'updatedAt',
      title: '更新时间',
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
      width: 120,
      render: (_: any, row: ApprovalRule) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditRuleModal(row)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400 transition-colors"
            title="编辑"
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg shadow-slate-500/20">
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">系统管理</h1>
            <p className="text-sm text-slate-500">用户管理、审批规则配置</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertCircle size={14} className="text-amber-400" />
          <span className="text-xs font-medium text-amber-400">L5 权限</span>
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
            onClick={() => setActiveTab('users')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              activeTab === 'users'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <User size={16} />
            用户管理
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              activeTab === 'rules'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Shield size={16} />
            审批规则
          </button>
        </div>
        {activeTab === 'users' && (
          <button
            onClick={openCreateUserModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
          >
            <Plus size={18} />
            创建用户
          </button>
        )}
      </div>

      {loading ? (
        <Loading text="加载中..." />
      ) : activeTab === 'users' ? (
        <DataTable
          columns={userColumns}
          data={users}
          loading={loading}
          rowKey="id"
          emptyText="暂无用户数据"
        />
      ) : (
        <DataTable
          columns={ruleColumns}
          data={rules}
          loading={loading}
          rowKey="id"
          emptyText="暂无审批规则"
        />
      )}

      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">
                {selectedUser ? '编辑用户' : '创建用户'}
              </h3>
              <button
                onClick={() => { setUserModalOpen(false); resetUserForm(); }}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">姓名 *</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="请输入姓名"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">手机号 *</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="请输入手机号"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">邮箱</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="请输入邮箱"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">部门</label>
                  <input
                    type="text"
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    placeholder="请输入部门"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">角色 *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  >
                    {roleOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">权限级别 *</label>
                  <select
                    value={userForm.level}
                    onChange={(e) => setUserForm({ ...userForm, level: Number(e.target.value) })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  >
                    {[1, 2, 3, 4, 5].map(level => (
                      <option key={level} value={level}>{levelLabels[level]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">所属门店</label>
                <select
                  value={userForm.storeId}
                  onChange={(e) => setUserForm({ ...userForm, storeId: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                >
                  {storeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {!selectedUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">初始密码 *</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="请输入初始密码"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => { setUserModalOpen(false); resetUserForm(); }}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={selectedUser ? handleUpdateUser : handleCreateUser}
                disabled={submitting || !userForm.name.trim() || !userForm.phone.trim() || (!selectedUser && !userForm.password)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '提交中...' : selectedUser ? '保存修改' : '创建用户'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ruleModalOpen && selectedRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">编辑审批规则</h3>
              <button
                onClick={() => { setRuleModalOpen(false); resetRuleForm(); }}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">规则类型</label>
                  <select
                    value={ruleForm.type}
                    onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value as any })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">规则名称 *</label>
                  <input
                    type="text"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    placeholder="请输入规则名称"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">最小金额</label>
                  <input
                    type="number"
                    value={ruleForm.minAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, minAmount: Number(e.target.value) })}
                    placeholder="0 表示不限"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">最大金额</label>
                  <input
                    type="number"
                    value={ruleForm.maxAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, maxAmount: Number(e.target.value) })}
                    placeholder="0 表示不限"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">审批层级 *</label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleLevel(level)}
                      className={cn(
                        'flex-1 p-3 rounded-xl border transition-all text-center',
                        ruleForm.levels.includes(level)
                          ? level >= 4 ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                            : level >= 3 ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                            : level >= 2 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-slate-500/20 border-slate-500 text-slate-300'
                          : 'bg-slate-800/30 border-slate-700/50 text-slate-500 hover:bg-slate-800/50'
                      )}
                    >
                      <Shield size={18} className="mx-auto mb-1" />
                      <p className="text-xs font-medium">{levelLabels[level]}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">描述</label>
                <textarea
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  placeholder="请输入规则描述（可选）..."
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleForm.enabled}
                    onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-sm text-slate-300">启用此规则</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-800/50 bg-slate-800/20">
              <button
                onClick={() => { setRuleModalOpen(false); resetRuleForm(); }}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateRule}
                disabled={submitting || !ruleForm.name.trim() || ruleForm.levels.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loading type="spinner" size="sm" />}
                {submitting ? '提交中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
