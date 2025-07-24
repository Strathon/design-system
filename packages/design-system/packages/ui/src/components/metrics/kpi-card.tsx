import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Card, CardContent, CardHeader } from '../card/card';
import { Badge } from '../badge/badge';

const kpiCardVariants = cva(
  'transition-all duration-150 hover:shadow-md',
  {
    variants: {
      status: {
        success: 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50',
        warning: 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/50',
        error: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50',
        neutral: 'border-border bg-card',
      },
      size: {
        default: '',
        compact: 'p-4',
        large: 'p-8',
      },
    },
    defaultVariants: {
      status: 'neutral',
      size: 'default',
    },
  }
);

const valueVariants = cva(
  'font-bold leading-none',
  {
    variants: {
      size: {
        default: 'text-2xl',
        compact: 'text-xl',
        large: 'text-3xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface TrendData {
  value: number;
  timestamp: Date | string;
}

export interface ChangeIndicator {
  value: number;
  type: 'increase' | 'decrease' | 'neutral';
  period: string;
  isPositive?: boolean; // Whether the change is good (e.g., cost decrease is positive)
}

export interface KPICardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof kpiCardVariants> {
  title: string;
  value: string | number;
  unit?: string;
  change?: ChangeIndicator;
  trend?: TrendData[];
  target?: number;
  loading?: boolean;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onCardClick?: () => void;
}

const StatusIcon = ({ status }: { status: 'success' | 'warning' | 'error' | 'neutral' }) => {
  const iconProps = { className: 'w-4 h-4' };
  
  switch (status) {
    case 'success':
      return <CheckCircle {...iconProps} className="w-4 h-4 text-green-600" />;
    case 'warning':
      return <AlertTriangle {...iconProps} className="w-4 h-4 text-yellow-600" />;
    case 'error':
      return <XCircle {...iconProps} className="w-4 h-4 text-red-600" />;
    default:
      return null;
  }
};

const ChangeIcon = ({ type }: { type: 'increase' | 'decrease' | 'neutral' }) => {
  const iconProps = { className: 'w-4 h-4' };
  
  switch (type) {
    case 'increase':
      return <TrendingUp {...iconProps} />;
    case 'decrease':
      return <TrendingDown {...iconProps} />;
    default:
      return <Minus {...iconProps} />;
  }
};

const MiniTrendChart = ({ data }: { data: TrendData[] }) => {
  if (!data || data.length < 2) return null;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const isPositiveTrend = values[values.length - 1] >= values[0];

  return (
    <div className="h-12 w-full">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={isPositiveTrend ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
          strokeWidth="2"
          points={points}
          className="drop-shadow-sm"
        />
        <defs>
          <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositiveTrend ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} stopOpacity="0.2" />
            <stop offset="100%" stopColor={isPositiveTrend ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          fill="url(#trendGradient)"
          points={`0,100 ${points} 100,100`}
        />
      </svg>
    </div>
  );
};

const LoadingSkeleton = ({ size }: { size: 'default' | 'compact' | 'large' }) => (
  <div className="animate-pulse">
    <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
    <div className={cn(
      'bg-muted rounded mb-2',
      size === 'compact' ? 'h-6' : size === 'large' ? 'h-10' : 'h-8'
    )}></div>
    <div className="h-3 bg-muted rounded w-1/2"></div>
  </div>
);

const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({
    className,
    title,
    value,
    unit,
    change,
    trend,
    target,
    loading = false,
    description,
    icon: Icon,
    status = 'neutral',
    size = 'default',
    onCardClick,
    ...props
  }, ref) => {
    const isClickable = !!onCardClick;

    const getChangeColor = (change: ChangeIndicator) => {
      if (change.type === 'neutral') return 'text-muted-foreground';
      
      const isGoodChange = change.isPositive !== undefined 
        ? change.isPositive 
        : change.type === 'increase';
      
      return isGoodChange ? 'text-green-600' : 'text-red-600';
    };

    const formatValue = (val: string | number) => {
      if (typeof val === 'number') {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toLocaleString();
      }
      return val;
    };

    return (
      <Card
        ref={ref}
        className={cn(
          kpiCardVariants({ status, size }),
          isClickable && 'cursor-pointer hover:-translate-y-px',
          className
        )}
        onClick={onCardClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick?.();
          }
        } : undefined}
        aria-label={isClickable ? `View details for ${title}` : undefined}
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>
          <div className="flex items-center space-x-1">
            {status !== 'neutral' && <StatusIcon status={status} />}
            {status !== 'neutral' && (
              <Badge 
                variant={status === 'success' ? 'success' : status === 'warning' ? 'warning' : 'destructive'}
                size="sm"
                className="capitalize"
              >
                {status}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {loading ? (
            <LoadingSkeleton size={size} />
          ) : (
            <>
              <div className="flex items-baseline space-x-2 mb-2">
                <span className={cn(valueVariants({ size }))}>
                  {formatValue(value)}
                </span>
                {unit && (
                  <span className="text-sm text-muted-foreground font-medium">
                    {unit}
                  </span>
                )}
              </div>

              {change && (
                <div className={cn(
                  'flex items-center space-x-1 mb-3 text-sm',
                  getChangeColor(change)
                )}>
                  <ChangeIcon type={change.type} />
                  <span className="font-medium">
                    {change.type !== 'neutral' && (change.type === 'increase' ? '+' : '')}
                    {Math.abs(change.value)}%
                  </span>
                  <span className="text-muted-foreground">
                    {change.period}
                  </span>
                </div>
              )}

              {description && (
                <p className="text-xs text-muted-foreground mb-3">
                  {description}
                </p>
              )}

              {trend && trend.length > 0 && (
                <div className="mb-3">
                  <MiniTrendChart data={trend} />
                </div>
              )}

              {target && (
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium">
                      {formatValue(target)}{unit}
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-muted rounded-full h-1.5">
                    <div
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        typeof value === 'number' && value >= target
                          ? 'bg-green-500'
                          : 'bg-primary'
                      )}
                      style={{
                        width: `${Math.min(
                          (typeof value === 'number' ? value : 0) / target * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }
);

KPICard.displayName = 'KPICard';

export { KPICard, kpiCardVariants, type TrendData, type ChangeIndicator };
