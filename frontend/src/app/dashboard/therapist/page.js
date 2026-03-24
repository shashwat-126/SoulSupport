"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TherapistDashboardAliasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/therapist-dashboard');
  }, [router]);

  return <p className="px-4 py-10 text-sm text-slate-600">Redirecting...</p>;
}
