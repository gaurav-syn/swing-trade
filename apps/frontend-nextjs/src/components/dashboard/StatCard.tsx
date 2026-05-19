import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  isCurrency?: boolean;
  isPercent?: boolean;
  className?: string;
}

export function StatCard({
  title, value, prefix, suffix, change, changeLabel,
  icon: Icon, iconColor = 'text-primary', isCurrency, isPercent, className,
}: StatCardProps) {
  const displayValue = isCurrency
    ? formatCurrency(Number(value))
    : isPercent
      ? `${Number(value).toFixed(2)}%`
      : value;

  const isPositive = change !== undefined && change >= 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className={cn('bg-card border border-border rounded-xl p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <div className={cn('p-2 rounded-lg bg-primary/10', iconColor.replace('text-', 'bg-').replace('400', '400/10'))}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
      </div>
      <div>
        <p className="text-xl font-bold text-foreground font-mono">
          {prefix}{displayValue}{suffix}
        </p>
        {change !== undefined && (
          <p className={cn('flex items-center gap-1 text-xs mt-1', isPositive ? 'text-profit' : isNegative ? 'text-loss' : 'text-muted-foreground')}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {formatPercent(change)} {changeLabel}
          </p>
        )}
      </div>
    </div>
  );
}
