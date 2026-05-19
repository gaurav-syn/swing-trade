import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'profit' | 'loss' | 'warning' | 'info' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-secondary text-secondary-foreground',
    profit: 'bg-profit/10 text-profit',
    loss: 'bg-loss/10 text-loss',
    warning: 'bg-yellow-500/10 text-yellow-400',
    info: 'bg-blue-500/10 text-blue-400',
    outline: 'border border-border text-muted-foreground',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
