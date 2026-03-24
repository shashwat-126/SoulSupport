import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function Sidebar({ active }) {
  const { user } = useAuth();
  const isTherapist = user?.userType === 'therapist';
  const prefix = isTherapist ? '/therapist-dashboard' : '/dashboard';

  const links = [
    { href: prefix, label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { href: `${prefix}/sessions`, label: 'Sessions', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { href: `${prefix}/profile`, label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    {
      href: `${prefix}/assistant`,
      label: 'Assistant',
      icon: 'M9.75 3a3.75 3.75 0 00-3.75 3.75V9a3 3 0 01-.88 2.12l-.56.56A1 1 0 005.27 13H18.73a1 1 0 00.71-1.71l-.56-.56A3 3 0 0118 9V6.75A3.75 3.75 0 0014.25 3h-4.5zM9 17a3 3 0 006 0H9z',
    },
    { href: `${prefix}/settings`, label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  return (
    <aside className="sticky top-24 w-full md:w-64 shrink-0 rounded-2xl border border-border bg-surface p-4 shadow-sm h-fit">
      <div className="mb-4 px-3">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
          {isTherapist ? 'Therapist Portal' : 'User Dashboard'}
        </p>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary',
              active === link.href 
                ? 'bg-primary-soft text-primary shadow-sm'
                : 'text-text-secondary hover:bg-surface-alt hover:text-charcoal'
            )}
          >
            <svg 
              className={cn("w-5 h-5 transition-colors", active === link.href ? "text-primary" : "text-text-muted group-hover:text-charcoal")} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              {link.label === 'Settings' && <circle cx="12" cy="12" r="3" />}
            </svg>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
