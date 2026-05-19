import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return <div className={cn('flex items-center justify-between mb-4', className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return <h3 className={cn('text-sm font-semibold text-muted-foreground uppercase tracking-wide', className)} {...props}>{children}</h3>;
}
