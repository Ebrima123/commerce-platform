import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

// ─── Button ───────────────────────────────────────────────────────────────────

export const buttonVariants = cva(
  // iOS-style: rounded, semibold, and a quick press-in rather than a hover colour.
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[15px] font-semibold transition-[transform,opacity,background-color] duration-150 active:scale-[0.97] active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-[18px] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-foreground hover:bg-brand/90',
        // iOS "gray" button: filled, no border.
        outline: 'bg-muted text-foreground hover:bg-muted/70',
        tinted: 'bg-brand/10 text-brand hover:bg-brand/15',
        ghost: 'text-foreground hover:bg-muted/70',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 rounded-lg px-3.5 text-[13px] [&_svg]:size-4',
        md: 'h-10 px-4',
        lg: 'h-12 rounded-[14px] px-6 text-[17px]',
        icon: 'h-10 w-10 rounded-full',
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
        // 16px text stops iPhones zooming in when the field is tapped.
        'flex h-11 w-full rounded-xl border-0 bg-muted px-3.5 text-base placeholder:text-muted-foreground',
        'focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 disabled:opacity-50',
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
  <div className={cn('rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]', className)} {...props} />
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
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', badgeTones[tone], className)} {...props} />
);

// ─── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action, className }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6 py-16', className)}>
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">{icon}</div>}
      <p className="text-[17px] font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
