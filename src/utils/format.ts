import dayjs from 'dayjs';

export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '¥0.00';
  }
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString('zh-CN');
};

export const formatDate = (value: string | Date | undefined | null): string => {
  if (!value) {
    return '-';
  }
  return dayjs(value).format('YYYY-MM-DD');
};

export const formatDateTime = (value: string | Date | undefined | null): string => {
  if (!value) {
    return '-';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
};

export const formatPercent = (
  value: number | undefined | null,
  decimals: number = 2
): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0%';
  }
  return `${(value * 100).toFixed(decimals)}%`;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    normal: 'bg-green-500/20 text-green-400 border-green-500/30',
    open: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    pass: 'bg-green-500/20 text-green-400 border-green-500/30',
    matched: 'bg-green-500/20 text-green-400 border-green-500/30',
    arrived: 'bg-green-500/20 text-green-400 border-green-500/30',

    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    scheduled: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    adjusted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    investigating: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    loading: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_transit: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    accepted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    executing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',

    fault: 'bg-red-500/20 text-red-400 border-red-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    maintenance: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    fail: 'bg-red-500/20 text-red-400 border-red-500/30',
    mismatch: 'bg-red-500/20 text-red-400 border-red-500/30',
    delayed: 'bg-red-500/20 text-red-400 border-red-500/30',
    alert: 'bg-red-500/20 text-red-400 border-red-500/30',
    issue_found: 'bg-red-500/20 text-red-400 border-red-500/30',
    escalated: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    expired: 'bg-red-500/20 text-red-400 border-red-500/30',
    deteriorated: 'bg-red-500/20 text-red-400 border-red-500/30',
    hygiene: 'bg-red-500/20 text-red-400 border-red-500/30',
    temperature: 'bg-red-500/20 text-red-400 border-red-500/30',
    other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
    approved_store: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    approved_region: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    approved_general: 'bg-green-500/20 text-green-400 border-green-500/30',
    pending_approval: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    unused: 'bg-green-500/20 text-green-400 border-green-500/30',
    used: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    expired_coupon: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    bronze: 'bg-amber-700/20 text-amber-600 border-amber-700/30',
    silver: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
    gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    platinum: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
    diamond: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
  };
  return colorMap[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

export const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    normal: '正常',
    open: '营业中',
    closed: '已关闭',
    maintenance: '维护中',
    warning: '警告',
    fault: '故障',
    pending: '待处理',
    approved: '已批准',
    approved_store: '店长批准',
    approved_region: '区域批准',
    approved_general: '总经理批准',
    rejected: '已拒绝',
    completed: '已完成',
    processing: '处理中',
    in_progress: '进行中',
    scheduled: '已排程',
    draft: '草稿',
    confirmed: '已确认',
    adjusted: '已调整',
    escalated: '已升级',
    pass: '通过',
    fail: '未通过',
    matched: '一致',
    mismatch: '不一致',
    investigating: '调查中',
    resolved: '已解决',
    loading: '装载中',
    in_transit: '运输中',
    arrived: '已到达',
    delayed: '延误',
    alert: '告警',
    assigned: '已分配',
    accepted: '已接受',
    issue_found: '发现问题',
    expired: '已过期',
    deteriorated: '变质',
    hygiene: '卫生问题',
    temperature: '温度异常',
    other: '其他',
    executing: '执行中',
    pending_approval: '待审批',
    remove: '下架',
    recall: '召回',
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
    critical: '严重',
    unused: '未使用',
    used: '已使用',
    expired_coupon: '已过期',
    discount: '折扣券',
    amount: '满减券',
    gift: '赠品券',
    bronze: '青铜',
    silver: '白银',
    gold: '黄金',
    platinum: '铂金',
    diamond: '钻石',
    supplier: '供应商',
    warehouse: '仓库',
    kitchen: '中央厨房',
    store: '门店',
    food_safety: '食品安全',
    equipment: '设备',
    approval: '审批',
    reconciliation: '对账',
  };
  return textMap[status] || status;
};
