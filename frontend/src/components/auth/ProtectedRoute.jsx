"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function getDefaultRouteForUser(user) {
  if (user?.userType === 'therapist') {
    return '/therapist-dashboard';
  }

  if (user?.userType === 'admin') {
    return '/admin';
  }

  return '/dashboard';
}

export function ProtectedRoute({ children, allowTherapistOnly = false, allowedUserTypes = null }) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  const allowedTypes = Array.isArray(allowedUserTypes) && allowedUserTypes.length > 0
    ? allowedUserTypes
    : allowTherapistOnly
      ? ['therapist']
      : null;

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (allowedTypes && !allowedTypes.includes(user?.userType)) {
      router.replace(getDefaultRouteForUser(user));
    }
  }, [allowedTypes, isAuthenticated, loading, router, user]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Checking access..." />
      </div>
    );
  }

  if (allowedTypes && !allowedTypes.includes(user?.userType)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Checking access..." />
      </div>
    );
  }

  return children;
}
