"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navigation } from '@/components/layout/Navigation';

const items = [
  { href: '/therapist-dashboard', label: 'Overview' },
  { href: '/therapist-dashboard/sessions', label: 'Sessions' },
  { href: '/therapist-dashboard/profile', label: 'Profile' },
  { href: '/therapist-dashboard/reviews', label: 'Reviews' },
  { href: '/therapist-dashboard/assistant', label: 'Assistant' },
];

export default function TherapistDashboardLayout({ children }) {
  return (
    <ProtectedRoute allowTherapistOnly>
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <Navigation items={items} />
        {children}
      </div>
    </ProtectedRoute>
  );
}
