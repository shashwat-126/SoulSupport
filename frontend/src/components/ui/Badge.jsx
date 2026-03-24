import { cn } from '@/lib/utils';

const tones = {
  neutral: 'bg-surface-alt border-border text-charcoal',
  success: 'bg-green-50 border-green-200 text-green-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-accent-soft border-accent/20 text-accent-strong',
  primary: 'bg-primary-soft border-primary/20 text-primary',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
};

export function Badge({ tone = 'neutral', children, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors', tones[tone], className)}>
      {children}
    </span>
  );
}
