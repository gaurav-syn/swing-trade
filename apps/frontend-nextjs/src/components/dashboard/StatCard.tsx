import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconClassName?: string;
  isCurrency?: boolean;
  isPercent?: boolean;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  title, value, change, changeLabel,
  icon: Icon, iconClassName = 'stat-icon-blue',
  isCurrency, isPercent, className, valueClassName,
}: StatCardProps) {
  const displayValue = isCurrency
    ? formatCurrency(Number(value))
    : isPercent
      ? `${Number(value).toFixed(2)}%`
      : value;

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-4 hover:border-border/80 transition-colors shadow-card group',
      className,
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight max-w-[calc(100%-3rem)]">
          {title}
        </p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconClassName)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>

      <p className={cn('text-xl font-bold text-foreground font-tabular tracking-tight', valueClassName)}>
        {displayValue}
      </p>

      {change !== undefined && (
        <p className={cn(
          'flex items-center gap-1 text-[11px] mt-1.5 font-medium',
          isPositive ? 'text-profit' : isNegative ? 'text-loss' : 'text-muted-foreground',
        )}>
          {isPositive
            ? <TrendingUp className="w-3 h-3" />
            : isNegative
              ? <TrendingDown className="w-3 h-3" />
              : null}
          {formatPercent(change)} {changeLabel}
        </p>
      )}
    </div>
  );
}
