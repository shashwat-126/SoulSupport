"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { sessionService } from '@/services/sessionService';
import { useSessionMutations } from '@/hooks/useSessions';
import { useReviewMutations, useSessionReview } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

function formatDuration(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function SessionMeetingContent() {
  const params = useParams();
  const bookingId = params?.bookingId;
  const [reason, setReason] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, reviewTitle: '', comment: '' });
  const [now, setNow] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const { updateCompletionStatus } = useSessionMutations();
  const { createReview } = useReviewMutations();

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', bookingId],
    queryFn: () => sessionService.getSession(bookingId),
    enabled: !!bookingId,
  });

  const session = sessionData?.data?.session;

  const meetingQuery = useQuery({
    queryKey: ['meeting-access', bookingId],
    queryFn: () => sessionService.getMeetingAccess(bookingId),
    enabled: !!bookingId && session?.status === 'confirmed',
    retry: false,
  });

  const { data: sessionReview } = useSessionReview(bookingId);

  const startsAt = new Date(session?.sessionDate || 0);
  const endsAt = session?.sessionDate
    ? new Date(new Date(session.sessionDate).getTime() + (session.durationMinutes || 60) * 60 * 1000)
    : new Date(0);

  const isBeforeStart = now < startsAt;
  const isDuringSession = now >= startsAt && now <= endsAt;
  const isExpired = now > endsAt;

  const countdown = formatDuration(startsAt - now);
  const activeTimer = formatDuration(now - startsAt);

  const roomId = meetingQuery.data?.data?.meetingRoomId || session?.meetingRoomId;
  const embedUrl = roomId ? `https://meet.jit.si/${roomId}` : null;

  const submitCompletion = async (status) => {
    const cancellationStatus =
      user?.userType === 'therapist' ? 'cancelled_by_therapist' : 'cancelled_by_user';

    try {
      await updateCompletionStatus.mutateAsync({
        id: bookingId,
        data: {
          status: status === 'cancelled' ? cancellationStatus : status,
          cancellationReason: status === 'cancelled' ? reason : undefined,
        },
      });
      toast.success('Session status submitted');
    } catch (error) {
      toast.error(String(error || 'Failed to submit status'));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await createReview.mutateAsync({
        sessionId: bookingId,
        rating: Number(reviewForm.rating),
        reviewTitle: reviewForm.reviewTitle,
        comment: reviewForm.comment,
      });
      toast.success('Review submitted');
    } catch (error) {
      toast.error(String(error || 'Failed to submit review'));
    }
  };

  if (sessionLoading) return <p className="px-4 py-10 text-sm text-slate-600">Loading session...</p>;
  if (!session) return <p className="px-4 py-10 text-sm text-slate-600">Session not found.</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Session Room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>
            Scheduled for {new Date(session.sessionDate).toLocaleString()} ({session.durationMinutes || 60} mins)
          </p>
          {isBeforeStart && <p>Session starts in: <strong>{countdown}</strong></p>}
          {isDuringSession && <p>Session active for: <strong>{activeTimer}</strong></p>}
          {isExpired && <p>Session window has expired.</p>}
          {meetingQuery.error && (
            <p className="text-red-600">
              {String(meetingQuery.error)}
            </p>
          )}
        </CardContent>
      </Card>

      {isDuringSession && embedUrl && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center justify-between">
              <a href={meetingQuery.data?.data?.meetingLink || session.meetingLink} target="_blank" rel="noreferrer">
                <Button>Join Meeting</Button>
              </a>
            </div>
            <iframe
              title="SoulSupport Session"
              src={embedUrl}
              allow="camera; microphone; fullscreen; display-capture"
              className="h-[70vh] w-full rounded-xl border border-border"
            />
          </CardContent>
        </Card>
      )}

      {isExpired && (
        <Card>
          <CardHeader>
            <CardTitle>Session Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button onClick={() => submitCompletion('completed')} disabled={updateCompletionStatus.isPending}>
                Session Completed
              </Button>
              <Button variant="secondary" onClick={() => submitCompletion('cancelled')} disabled={updateCompletionStatus.isPending || !reason}>
                Session Cancelled
              </Button>
            </div>
            <Textarea
              label="Cancellation Reason (required for cancelled)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Therapist unavailable, user unavailable, technical issues, emergency, other"
            />
          </CardContent>
        </Card>
      )}

      {session.status === 'completed' && !sessionReview?.data?.data?.review && (
        <Card>
          <CardHeader>
            <CardTitle>Review Therapist</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitReview} className="space-y-3">
              <Input
                type="number"
                label="Rating (1-5)"
                min={1}
                max={5}
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}
              />
              <Input
                label="Review Title"
                value={reviewForm.reviewTitle}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, reviewTitle: e.target.value }))}
              />
              <Textarea
                label="Review"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
              />
              <Button type="submit" disabled={createReview.isPending}>Submit Review</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SessionMeetingPage() {
  return (
    <ProtectedRoute>
      <SessionMeetingContent />
    </ProtectedRoute>
  );
}
