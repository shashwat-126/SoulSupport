"use client";

import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navigation } from '@/components/layout/Navigation';

const items = [
  { href: '/admin', label: 'Overview' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute allowedUserTypes={['admin']}>
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-6 sm:px-6 lg:px-8">
        <Navigation items={items} active={pathname} />
        {children}
      </div>
    </ProtectedRoute>
  );
}