import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'profit' | 'loss' | 'warning' | 'info' | 'outline' | 'purple';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-secondary text-secondary-foreground border border-border/50',
    profit:  'bg-profit/12 text-profit border border-profit/20',
    loss:    'bg-loss/12 text-loss border border-loss/20',
    warning: 'bg-yellow-500/12 text-yellow-400 border border-yellow-500/20',
    info:    'bg-blue-500/12 text-blue-400 border border-blue-500/20',
    outline: 'border border-border text-muted-foreground',
    purple:  'bg-purple-500/12 text-purple-400 border border-purple-500/20',
  };
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium leading-tight',
      variants[variant], className,
    )}>
      {children}
    </span>
  );
}
