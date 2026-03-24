"use client";

import { useTherapist, useTherapistReviews } from '@/hooks/useTherapists';
import { useAuth } from '@/hooks/useAuth';
import { ReviewCard } from '@/components/therapist/ReviewCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { AnimatedSection } from '@/components/common/AnimatedSection';

export default function TherapistReviewsPage() {
  const { user } = useAuth();
  const id = user?._id;
  const { data: profileData } = useTherapist(id);
  const { data, isLoading, error } = useTherapistReviews(id);
  const reviews = data?.data?.reviews ?? [];
  const therapist = profileData?.data?.therapist;

  return (
    <AnimatedSection className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-charcoal">Reviews</h1>
      {isLoading && <LoadingSpinner label="Loading reviews..." />}
      {error && <ErrorMessage message={String(error)} />}
      <div className="grid gap-3 md:grid-cols-2">
        {reviews.map((review) => (
          <ReviewCard key={review._id} review={review} />
        ))}
      </div>
      {!id && <p className="text-sm text-slate-600">Login as therapist to load your reviews.</p>}
      {id && therapist && reviews.length === 0 && !isLoading && (
        <p className="text-sm text-slate-600">No reviews yet. Encourage clients to leave feedback after sessions.</p>
      )}
    </AnimatedSection>
  );
}
