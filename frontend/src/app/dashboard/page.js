import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DashboardContentLoader from './DashboardContentLoader';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContentLoader />
    </ProtectedRoute>
  );
}
