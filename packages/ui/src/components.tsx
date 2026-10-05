import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

// ─── Button ───────────────────────────────────────────────────────────────────

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-foreground shadow-sm hover:bg-brand/90',
        outline: 'border border-input bg-card hover:bg-muted',
        ghost: 'hover:bg-muted',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-9 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = 'Button';

// ─── Form controls ────────────────────────────────────────────────────────────

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('text-sm font-medium text-foreground', className)} {...props} />
);

// ─── Surfaces ─────────────────────────────────────────────────────────────────

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-xl border border-border/70 bg-card shadow-sm', className)} {...props} />
);

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
);

const badgeTones = {
  neutral: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  red: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
} as const;

export const Badge = ({ tone = 'neutral', className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) => (
  <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap', badgeTones[tone], className)} {...props} />
);

// ─── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action, className }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6 py-16', className)}>
      {icon && <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-muted/50 text-muted-foreground">{icon}</div>}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
