import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary', size = 'md', isLoading, className, children, disabled, ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    danger: 'bg-loss/10 text-loss hover:bg-loss/20',
    success: 'bg-profit/10 text-profit hover:bg-profit/20',
    outline: 'border border-border text-foreground hover:bg-accent',
  };
  const sizes = {
    sm: 'h-7 px-2.5 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}
