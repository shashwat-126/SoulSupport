"use client";

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { ReviewCard } from '@/components/therapist/ReviewCard';

export default function PublicProfilePage() {
  const params = useParams();
  const profileId = params?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['public-profile', profileId],
    queryFn: () => profileService.getPublicProfile(profileId),
    enabled: !!profileId,
  });

  const profile = data?.data?.profile;
  const latestReviews = data?.data?.latestReviews || [];

  if (isLoading) return <p className="px-4 py-10 text-sm text-slate-600">Loading profile...</p>;
  if (!profile) return <p className="px-4 py-10 text-sm text-slate-600">Profile not found.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-4">
            <Avatar src={profile.avatarUrl} name={profile.fullName} size={72} />
            <div>
              <p className="text-xl font-semibold text-charcoal">{profile.fullName}</p>
              <p className="text-sm text-slate-600">@{profile.username || 'user'}</p>
              <p className="text-sm text-slate-600">{profile.location || 'Location unavailable'}</p>
            </div>
          </div>
          <p className="text-slate-700">{profile.bio || 'No bio provided.'}</p>

          {profile.therapistProfile && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-semibold">Rating</p>
                <p className="text-slate-600">{profile.therapistProfile.averageRating || 0} / 5</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-semibold">Reviews</p>
                <p className="text-slate-600">{profile.therapistProfile.reviewCount || 0}</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-semibold">Total Sessions</p>
                <p className="text-slate-600">{profile.therapistProfile.totalSessions || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {latestReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Reviews</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {latestReviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
