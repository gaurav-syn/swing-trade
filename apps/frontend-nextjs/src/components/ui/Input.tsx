import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-9 bg-input border border-border rounded-lg text-sm text-foreground',
            'placeholder:text-muted-foreground transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            prefix ? 'pl-7 pr-3' : 'px-3',
            error && 'border-loss focus:ring-loss',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';
