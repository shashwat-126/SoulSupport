import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Navigation({ items = [], active }) {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-soft">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:text-primary-700',
            active === item.href && 'bg-primary-50 text-primary-700'
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
