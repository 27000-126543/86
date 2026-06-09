import { cn } from '@/lib/utils';

interface LoadingProps {
  type?: 'spinner' | 'skeleton' | 'pulse';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullscreen?: boolean;
  text?: string;
  className?: string;
}

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
  gap?: number;
  className?: string;
}

const spinnerSizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

const containerSizes = {
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export function Loading({
  type = 'spinner',
  size = 'md',
  fullscreen = false,
  text,
  className,
}: LoadingProps) {
  const renderSpinner = () => (
    <div
      className={cn(
        'rounded-full border-cyan-500/30 border-t-cyan-500 animate-spin',
        spinnerSizes[size]
      )}
    />
  );

  const renderPulse = () => (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-cyan-500 animate-bounce',
            size === 'sm' && 'w-1.5 h-1.5',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-2.5 h-2.5',
            size === 'xl' && 'w-3 h-3'
          )}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        !fullscreen && containerSizes[size],
        className
      )}
    >
      {type === 'spinner' && renderSpinner()}
      {type === 'pulse' && renderPulse()}
      {type === 'skeleton' && <Skeleton count={3} />}
      {text && (
        <p className={cn('text-slate-400', size === 'sm' ? 'text-xs' : size === 'xl' ? 'text-base' : 'text-sm')}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-900/90 border border-slate-800/50 shadow-2xl">
          <div className={cn('rounded-full border-cyan-500/30 border-t-cyan-500 animate-spin', spinnerSizes.xl)} />
          {text && <p className="text-slate-300 text-sm">{text}</p>}
        </div>
      </div>
    );
  }

  return content;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  gap = 8,
  className,
}: SkeletonProps) {
  const baseClass = 'bg-gradient-to-r from-slate-800 via-slate-700/80 to-slate-800 animate-pulse';

  const getVariantClass = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-lg';
      case 'card':
        return 'rounded-xl';
      case 'text':
      default:
        return 'rounded-md h-4';
    }
  };

  const getDefaultWidth = () => {
    if (width) return width;
    if (variant === 'circular') return 'w-10';
    if (variant === 'card') return 'w-full';
    return 'w-full';
  };

  const getDefaultHeight = () => {
    if (height) return height;
    if (variant === 'circular') return 'h-10';
    if (variant === 'rectangular') return 'h-24';
    if (variant === 'card') return 'h-32';
    return 'h-4';
  };

  const styleWidth = typeof width === 'number' ? `${width}px` : width;
  const styleHeight = typeof height === 'number' ? `${height}px` : height;

  if (count === 1) {
    return (
      <div
        className={cn(baseClass, getVariantClass(), getDefaultWidth(), getDefaultHeight(), className)}
        style={{
          width: styleWidth,
          height: styleHeight,
        }}
      />
    );
  }

  return (
    <div className="flex flex-col" style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            baseClass,
            getVariantClass(),
            variant === 'text' && i === count - 1 && 'w-3/4',
            className
          )}
          style={{
            width: variant === 'text' && i === count - 1 ? undefined : styleWidth,
            height: styleHeight,
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-900/50 to-slate-950/50 border border-slate-800/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton variant="text" width="80px" className="mb-2" />
          <Skeleton variant="text" width="120px" height="32px" />
        </div>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <Skeleton variant="text" width="100px" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 overflow-hidden">
      <div className="border-b border-slate-800/50 bg-slate-800/30 p-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} variant="text" width={`${100 / cols}%`} />
          ))}
        </div>
      </div>
      <div className="p-3 space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                variant="text"
                width={`${100 / cols}%`}
                className={colIndex === 0 ? 'opacity-100' : 'opacity-70'}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Loading;
