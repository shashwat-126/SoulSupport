"use client";

import { useSessions, useSessionMutations } from '@/hooks/useSessions';
import { SessionList } from '@/components/session/SessionList';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { AnimatedSection } from '@/components/common/AnimatedSection';
import toast from 'react-hot-toast';

export default function TherapistSessionsPage() {
  const { list } = useSessions(
    { role: 'therapist' },
    {
      refetchOnWindowFocus: false,
    }
  );
  const { updateStatus, cancelSessionAsTherapist } = useSessionMutations();
  const sessions = list.data?.data?.sessions ?? [];

  const handleConfirm = async (id) => {
    await updateStatus.mutateAsync({ id, data: { status: 'confirmed' } });
    toast.success('Session confirmed');
  };

  const handleCancel = async (id) => {
    const reasonInput = window.prompt('Cancellation reason (required):', 'Therapist unavailable');
    const reason = (reasonInput || '').trim();
    if (!reason) return;
    await cancelSessionAsTherapist.mutateAsync({ id, reason });
    toast.success('Session cancelled');
  };

  return (
    <AnimatedSection className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-charcoal">Manage sessions</h1>
      {list.isLoading && <LoadingSpinner label="Loading sessions..." />}
      {list.error && <ErrorMessage message={String(list.error)} />}
      <SessionList sessions={sessions} onConfirm={handleConfirm} onCancel={handleCancel} />
    </AnimatedSection>
  );
}
