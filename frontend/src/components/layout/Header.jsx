"use client";

import { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';

const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Therapists', path: '/therapists' },
  { name: 'Resources', path: '/resources' },
  { name: 'Community', path: '/forum' },
];

function getDashboardHref(userType) {
  if (userType === 'therapist') {
    return '/therapist-dashboard';
  }

  if (userType === 'admin') {
    return '/admin';
  }

  return '/dashboard';
}

function HeaderComponent() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dashboardHref = useMemo(() => getDashboardHref(user?.userType), [user?.userType]);

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border/40 transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" prefetch={true} className="flex items-center gap-2 group outline-none rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-sage flex items-center justify-center shadow-soft transform group-hover:scale-105 transition-transform">
               <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
               </svg>
            </div>
            <span className="font-heading text-xl font-bold text-charcoal tracking-tight">Soul<span className="text-primary">Support</span></span>
          </Link>
        </div>
        
        <nav className="hidden items-center gap-1 p-1.5 rounded-full bg-surface-alt/50 border border-border/50 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.name} 
                href={link.path} 
                prefetch={true} 
                className={cn(
                  "px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary hover:bg-white/50'
                )}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-4 bg-surface-alt/50 pl-4 pr-1 py-1 rounded-full border border-border/50">
                <Link href={dashboardHref} prefetch={true} className="text-sm font-semibold text-charcoal hover:text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1">
                 Dashboard
              </Link>
              <div className="h-4 w-px bg-border"></div>
                <NotificationBell />
                <div className="h-4 w-px bg-border"></div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-text-muted hover:text-red-600 hover:bg-red-50 rounded-full px-3 py-1.5 text-xs">
                Logout
              </Button>
              <Link href={dashboardHref} prefetch={true} className="outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
                <Avatar name={user?.fullName || user?.email || 'User'} size={36} className="ring-2 ring-white shadow-sm" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" prefetch={true} className="outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full text-charcoal hover:bg-surface-alt font-semibold px-4">Log in</Button>
              </Link>
              <Link href="/register" prefetch={true} className="outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
                <Button size="sm" className="rounded-full px-6 shadow-soft hover:shadow-md transition-all font-semibold">Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-charcoal outline-none rounded-md focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-surface">
          <nav className="flex flex-col px-4 py-4 space-y-2">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-base font-semibold",
                    isActive ? "bg-primary-soft text-primary" : "text-text-secondary hover:bg-surface-alt hover:text-charcoal"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="my-2 h-px bg-border/50"></div>
            {isAuthenticated ? (
              <>
                <Link 
                  href={dashboardHref} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-semibold text-text-secondary hover:bg-surface-alt"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">Log in</Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-center">Get Started</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export const Header = memo(HeaderComponent);
