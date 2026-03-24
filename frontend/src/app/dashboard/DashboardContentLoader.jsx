'use client';

import dynamic from 'next/dynamic';

const DashboardContent = dynamic(() => import('./DashboardClient'), { ssr: false });

export default function DashboardContentLoader() {
  return <DashboardContent />;
}
