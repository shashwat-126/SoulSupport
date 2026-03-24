"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTherapist, useTherapistReviews } from '@/hooks/useTherapists';
import { useAuth } from '@/hooks/useAuth';
import { ReviewCard } from '@/components/therapist/ReviewCard';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useSessionMutations } from '@/hooks/useSessions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { CalendarClock, CircleDollarSign, GraduationCap, Star, Timer } from 'lucide-react';

const BookingModal = dynamic(
  () => import('@/components/therapist/BookingModal').then(mod => ({ default: mod.BookingModal })),
  { ssr: false, loading: () => null }
);

function getTherapistUser(therapist) {
  const userIdAsObject = therapist?.userId && typeof therapist.userId === 'object'
    ? therapist.userId
    : null;
  return therapist?.user || userIdAsObject || null;
}

function normalizeParamId(value) {
  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return typeof value === 'string' ? value : '';
}

function getErrorMessage(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error?.message === 'string') return error.message;
  return 'Unable to load therapist profile.';
}

export default function TherapistPage() {
  const params = useParams();
  const therapistId = normalizeParamId(params?.id);
  const { user } = useAuth();
  const { data, isLoading, error } = useTherapist(therapistId);
  const { data: reviewsData } = useTherapistReviews(therapistId);
  const { createSlotHold, confirmSlotHold } = useSessionMutations();
  const [open, setOpen] = useState(false);

  const therapist = data?.data?.therapist || data?.therapist || data?.data || null;
  const therapistUser = getTherapistUser(therapist);
  const displayName = therapist?.fullName || therapistUser?.fullName || 'Therapist';
  const displayBio = therapist?.bio || therapistUser?.bio || 'No bio provided yet.';
  const displayQualifications = therapist?.qualifications || 'Licensed mental health professional';
  const displaySpecializations = Array.isArray(therapist?.specializations)
    ? therapist.specializations
    : [];
  const availabilityDays = Array.isArray(therapist?.availability?.days)
    ? therapist.availability.days
    : [];
  const displayRating = typeof therapist?.rating === 'number' ? therapist.rating.toFixed(1) : '0.0';
  const roundedRating = Math.round(Number(displayRating));
  const reviews = reviewsData?.data?.reviews ?? [];
  const isTherapist = user?.userType === 'therapist';
  const canBook = Boolean(user) && !isTherapist;
  const errorMessage = getErrorMessage(error);
  const showMissingState = !isLoading && !therapist;

  const handleBook = async (payload) => {
    const therapistUserId = therapistUser?._id || therapist?.userId;
    const holdResponse = await createSlotHold.mutateAsync({
      ...payload,
      therapistId: therapistUserId,
    });

    const hold = holdResponse?.data?.hold;
    if (!hold?._id) {
      throw new Error('Unable to lock slot. Please try again.');
    }

    await confirmSlotHold.mutateAsync({
      holdId: hold._id,
      data: {
        notes: payload?.notes || '',
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      {isLoading && <LoadingSpinner label="Loading therapist..." />}
      {error && <ErrorMessage message={errorMessage} />}
      {showMissingState && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft">
          <p className="font-heading text-2xl font-bold text-charcoal">Therapist not available</p>
          <p className="mt-3 text-sm text-slate-600">
            This profile could not be loaded. Public therapist pages only appear when the therapist is active,
            verified, and not marked private.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/therapists"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-primary-hover"
            >
              Browse therapists
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Back home
            </Link>
          </div>
        </div>
      )}
      {therapist && (
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar src={therapist.photoUrl || therapistUser?.avatarUrl} name={displayName} size={72} />
            <div className="space-y-1 sm:flex-1">
              <p className="font-heading text-2xl font-bold text-charcoal">{displayName}</p>
              <p className="text-sm text-slate-600">Therapist</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                  <Star className="h-4 w-4 fill-current" />
                  {displayRating}
                </span>
                <span>{'★'.repeat(Math.max(roundedRating, 0))}{'☆'.repeat(Math.max(5 - roundedRating, 0))}</span>
                <span>Based on {therapist?.totalReviews || 0} reviews</span>
                <span>{therapist?.totalSessions || 0} sessions</span>
              </div>
            </div>
            {!user ? (
              <Link
                href="/login"
                className="sm:ml-auto inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-base font-semibold text-white transition-all duration-300 hover:bg-primary-hover"
              >
                Log in to book
              </Link>
            ) : isTherapist ? (
              <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md text-sm sm:ml-auto">
                Therapists cannot book sessions
              </div>
            ) : (
              <Button className="sm:ml-auto" onClick={() => setOpen(true)}>
                Book session
              </Button>
            )}
          </div>

          <p className="text-slate-700">{displayBio}</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-3">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <CircleDollarSign className="h-4 w-4" />
                Hourly Rate
              </p>
              <p className="mt-1 text-lg font-bold text-charcoal">${therapist?.hourlyRate ?? 0}/hr</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-3">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Timer className="h-4 w-4" />
                Experience
              </p>
              <p className="mt-1 text-lg font-bold text-charcoal">{therapist?.experienceYears ?? 0} years</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-3 sm:col-span-2">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <GraduationCap className="h-4 w-4" />
                Qualifications
              </p>
              <p className="mt-1 text-sm text-slate-700">{displayQualifications}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-charcoal">Specializations</p>
            <div className="flex flex-wrap gap-2">
              {displaySpecializations.length > 0 ? (
                displaySpecializations.map((spec) => (
                  <Badge key={spec} tone="info" className="capitalize">
                    {spec}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-500">No specializations listed yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal">
              <CalendarClock className="h-4 w-4" />
              Availability
            </p>
            <p className="text-sm text-slate-700">
              {availabilityDays.length > 0
                ? availabilityDays.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')
                : 'Availability not specified'}
            </p>
            <p className="text-sm text-slate-600">
              {therapist?.availability?.timeStart || '--:--'} - {therapist?.availability?.timeEnd || '--:--'}
            </p>
          </div>
        </div>
      )}

      {reviews?.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-charcoal">Reviews</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        </div>
      )}

      <BookingModal
        open={open && canBook}
        therapist={therapist}
        onClose={() => setOpen(false)}
        onBook={handleBook}
      />
    </div>
  );
}
