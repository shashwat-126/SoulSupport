'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SessionStatusBadge } from './SessionStatusBadge';
import { formatDate, formatTime } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

const CANCELLABLE_SESSION_STATUSES = new Set(['pending', 'confirmed']);

export function SessionCard({ session, onUpdate, onCancel }) {
  const { user } = useAuth();
  const date = formatDate(session.sessionDate);
  const time = formatTime(session.sessionDate);
  const isTherapist = user?.userType === 'therapist';
  const targetUserId =
    typeof session.userId === 'string'
      ? session.userId
      : session.userId?._id;
  
  // Show therapist name for users, user name for therapists
  const displayName = user?.userType === 'therapist' 
    ? session.user?.name || 'User'
    : session.therapist?.name || 'Therapist';
  
  return (
    <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-heading text-lg font-semibold text-charcoal">{displayName}</p>
        <p className="text-sm text-slate-600">
          {date} at {time} · {session.durationMinutes || 60} mins
        </p>
        <p className="text-xs text-slate-500">
          {session.meetingLink ? (
            <a
              href={session.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary-hover"
            >
              Join via meeting link ↗
            </a>
          ) : (
            'Meeting link to be shared'
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <SessionStatusBadge status={session.status} />
        {isTherapist && targetUserId && (
          <Link href={`/profile/${targetUserId}`}>
            <Button variant="outline" size="sm">View Profile</Button>
          </Link>
        )}
        {session.status === 'confirmed' && (
          <Link href={`/session/${session._id}`}>
            <Button size="sm">Join Meeting</Button>
          </Link>
        )}
        {onUpdate && session.status === 'pending' && isTherapist && (
          <Button variant="secondary" size="sm" onClick={() => onUpdate(session._id)}>
            Confirm
          </Button>
        )}
        {onCancel && CANCELLABLE_SESSION_STATUSES.has(session.status) && (
          <Button variant="ghost" size="sm" onClick={() => onCancel(session._id)}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}
