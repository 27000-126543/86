import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusColor, getStatusText } from '@/utils/format';

interface StatusBadgeProps {
  status: string;
  text?: string;
  icon?: React.ReactNode;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  normal: <CheckCircle2 size={12} />,
  open: <CheckCircle2 size={12} />,
  completed: <CheckCircle2 size={12} />,
  approved: <CheckCircle2 size={12} />,
  pass: <CheckCircle2 size={12} />,
  matched: <CheckCircle2 size={12} />,
  arrived: <CheckCircle2 size={12} />,
  resolved: <CheckCircle2 size={12} />,
  approved_general: <CheckCircle2 size={12} />,
  low: <CheckCircle2 size={12} />,
  unused: <CheckCircle2 size={12} />,

  warning: <AlertCircle size={12} />,
  processing: <Loader2 size={12} className="animate-spin" />,
  in_progress: <Loader2 size={12} className="animate-spin" />,
  pending: <Clock size={12} />,
  scheduled: <Clock size={12} />,
  draft: <Circle size={12} />,
  confirmed: <CheckCircle2 size={12} />,
  adjusted: <AlertCircle size={12} />,
  investigating: <AlertCircle size={12} />,
  loading: <Loader2 size={12} className="animate-spin" />,
  in_transit: <Loader2 size={12} className="animate-spin" />,
  assigned: <Clock size={12} />,
  accepted: <Clock size={12} />,
  executing: <Loader2 size={12} className="animate-spin" />,
  pending_approval: <Clock size={12} />,
  approved_store: <CheckCircle2 size={12} />,
  approved_region: <CheckCircle2 size={12} />,
  medium: <AlertCircle size={12} />,
  used: <CheckCircle2 size={12} />,

  fault: <XCircle size={12} />,
  closed: <XCircle size={12} />,
  maintenance: <AlertCircle size={12} />,
  rejected: <XCircle size={12} />,
  fail: <XCircle size={12} />,
  mismatch: <XCircle size={12} />,
  delayed: <AlertTriangle size={12} />,
  alert: <AlertTriangle size={12} />,
  issue_found: <AlertTriangle size={12} />,
  escalated: <AlertTriangle size={12} />,
  expired: <XCircle size={12} />,
  deteriorated: <XCircle size={12} />,
  hygiene: <AlertTriangle size={12} />,
  temperature: <AlertTriangle size={12} />,
  other: <Circle size={12} />,
  high: <AlertTriangle size={12} />,
  urgent: <AlertTriangle size={12} />,
  critical: <AlertTriangle size={12} />,
  expired_coupon: <XCircle size={12} />,
};

const pulseStatuses = new Set([
  'alert',
  'urgent',
  'critical',
  'fault',
  'delayed',
  'temperature',
  'hygiene',
  'deteriorated',
  'escalated',
  'issue_found',
]);

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export default function StatusBadge({
  status,
  text,
  icon,
  pulse,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const shouldPulse = pulse ?? pulseStatuses.has(status);
  const colorClass = getStatusColor(status);
  const displayText = text ?? getStatusText(status);
  const displayIcon = icon ?? iconMap[status];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        'transition-all duration-200',
        colorClass,
        sizeClasses[size],
        shouldPulse && 'animate-pulse',
        className
      )}
    >
      {displayIcon && (
        <span
          className={cn(
            'flex-shrink-0',
            shouldPulse && 'animate-ping absolute opacity-75'
          )}
          style={{ width: iconSizes[size], height: iconSizes[size] }}
        />
      )}
      {displayIcon && <span className="flex-shrink-0">{displayIcon}</span>}
      <span className="whitespace-nowrap">{displayText}</span>
    </span>
  );
}
