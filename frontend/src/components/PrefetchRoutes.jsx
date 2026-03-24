'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    const routes = [
      '/dashboard',
      '/forum',
      '/therapists',
      '/resources',
      '/login',
      '/register',
      '/about',
      '/therapist-dashboard',
    ];

    routes.forEach((route) => router.prefetch(route));
  }, [router]);

  return null;
}
