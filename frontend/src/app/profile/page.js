"use client";

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { profileService } from '@/services/profileService';
import { PROFILE_QUERY_KEY } from '@/lib/queryKeys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

function ProfileContent() {
  const { data, isLoading } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileService.getMyProfile,
  });

  const profile = data?.data?.profile;

  if (isLoading) return <p className="text-sm text-slate-600">Loading profile...</p>;
  if (!profile) return <p className="text-sm text-slate-600">Profile not found.</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Profile</CardTitle>
          <Link href="/profile/edit">
            <Button>Edit Profile</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar src={profile.avatarUrl} name={profile.fullName || profile.email} size={72} />
            <div>
              <p className="text-xl font-semibold text-charcoal">{profile.fullName}</p>
              <p className="text-sm text-slate-600">@{profile.username || 'no-username'}</p>
              <p className="text-sm text-slate-600">{profile.location || 'Location not set'}</p>
            </div>
          </div>
          <p className="text-slate-700">{profile.bio || 'No bio yet.'}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="font-semibold">Email</p>
              <p className="text-slate-600">{profile.email}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="font-semibold">Joined</p>
              <p className="text-slate-600">{new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
