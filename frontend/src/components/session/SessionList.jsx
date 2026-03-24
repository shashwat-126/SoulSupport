'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { SessionCard } from './SessionCard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function SessionList({ sessions = [], onConfirm, onCancel }) {
  const { user } = useAuth();
  const isTherapist = user?.userType === 'therapist';

  if (!sessions.length) {
    return (
      <EmptyState
        title="No sessions scheduled yet."
        description={
          isTherapist
            ? 'When clients book sessions with you, they will appear here.'
            : 'Get started by finding a therapist and booking your first session.'
        }
        action={
          !isTherapist ? (
            <Link href="/therapists">
              <Button size="sm">Find a Therapist</Button>
            </Link>
          ) : null
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard key={session._id} session={session} onUpdate={onConfirm} onCancel={onCancel} />
      ))}
    </div>
  );
}
