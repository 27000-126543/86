import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  trend?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  colorTheme?: 'cyan' | 'green' | 'yellow' | 'orange' | 'purple' | 'red' | 'blue';
  onClick?: () => void;
  className?: string;
}

const colorThemes = {
  cyan: {
    bg: 'from-cyan-500/10 to-blue-500/5',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
    glow: 'shadow-cyan-500/10',
  },
  green: {
    bg: 'from-green-500/10 to-emerald-500/5',
    border: 'border-green-500/20',
    text: 'text-green-400',
    iconBg: 'bg-green-500/20',
    glow: 'shadow-green-500/10',
  },
  yellow: {
    bg: 'from-yellow-500/10 to-amber-500/5',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    iconBg: 'bg-yellow-500/20',
    glow: 'shadow-yellow-500/10',
  },
  orange: {
    bg: 'from-orange-500/10 to-red-500/5',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    iconBg: 'bg-orange-500/20',
    glow: 'shadow-orange-500/10',
  },
  purple: {
    bg: 'from-purple-500/10 to-violet-500/5',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
    glow: 'shadow-purple-500/10',
  },
  red: {
    bg: 'from-red-500/10 to-rose-500/5',
    border: 'border-red-500/20',
    text: 'text-red-400',
    iconBg: 'bg-red-500/20',
    glow: 'shadow-red-500/10',
  },
  blue: {
    bg: 'from-blue-500/10 to-indigo-500/5',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
    glow: 'shadow-blue-500/10',
  },
};

function useCountUp(targetValue: number, duration: number = 1500, decimals: number = 0) {
  const [displayValue, setDisplayValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const startValue = 0;
    const startTime = performance.now();
    startRef.current = startTime;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue.toFixed(decimals);
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  prefix = '',
  suffix = '',
  decimals = 0,
  colorTheme = 'cyan',
  onClick,
  className,
}: StatCardProps) {
  const displayValue = useCountUp(value, 1500, decimals);
  const theme = colorThemes[colorTheme];

  const formatValue = (val: string) => {
    const num = parseFloat(val);
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(2)}亿`;
    }
    if (num >= 10000) {
      return `${(num / 10000).toFixed(2)}万`;
    }
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5',
        'bg-gradient-to-br backdrop-blur-xl',
        'border',
        'transition-all duration-300 hover:scale-[1.02] cursor-pointer',
        theme.bg,
        theme.border,
        onClick && 'hover:shadow-lg',
        theme.glow,
        className
      )}
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-white/5 pointer-events-none" />

      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-current opacity-5 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-current opacity-5 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-slate-400 font-medium mb-1">{title}</p>
            <p className={cn('text-3xl font-bold tracking-tight', theme.text)}>
              {prefix}
              {formatValue(displayValue)}
              {suffix}
            </p>
          </div>
          {icon && (
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                theme.iconBg
              )}
            >
              <div className={theme.text}>{icon}</div>
            </div>
          )}
        </div>

        {trend !== undefined && (
          <div className="flex items-center gap-2">
            {trend >= 0 ? (
              <div className="flex items-center gap-1 text-green-400">
                <TrendingUp size={16} />
                <span className="text-sm font-medium">+{trend.toFixed(2)}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-400">
                <TrendingDown size={16} />
                <span className="text-sm font-medium">{trend.toFixed(2)}%</span>
              </div>
            )}
            <span className="text-xs text-slate-500">较上期</span>
          </div>
        )}
      </div>
    </div>
  );
}
