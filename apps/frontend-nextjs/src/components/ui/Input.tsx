import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefix, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-10 bg-input border border-border rounded-lg text-sm text-foreground',
            'placeholder:text-muted-foreground/50 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            prefix ? 'pl-7 pr-3' : 'px-3',
            error && 'border-loss/60 focus:ring-loss/30',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-loss">{error}</p>}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  ),
);
Input.displayName = 'Input';
