"use client";

import { useSessions, useSessionMutations } from '@/hooks/useSessions';
import { SessionList } from '@/components/session/SessionList';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import toast from 'react-hot-toast';

export default function DashboardSessionsPage() {
  const { list } = useSessions(
    {},
    {
      refetchOnWindowFocus: false,
    }
  );
  const { cancelSession } = useSessionMutations();
  const sessions = list.data?.data?.sessions ?? [];

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-charcoal">Sessions</h1>
      {list.isLoading && <LoadingSpinner label="Loading sessions..." />}
      {list.error && <ErrorMessage message={String(list.error)} />}
      <SessionList
        sessions={sessions}
        onCancel={(id) => cancelSession.mutateAsync({ id }).then(() => toast.success('Session cancelled'))}
      />
    </div>
  );
}
