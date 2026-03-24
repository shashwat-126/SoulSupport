"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { PROFILE_QUERY_KEY, ME_QUERY_KEY } from '@/lib/queryKeys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

function ProfileEditForm({ profile, updateMutation, uploadMutation }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [form, setForm] = useState(() => ({
    fullName: profile.fullName || '',
    username: profile.username || '',
    bio: profile.bio || '',
    location: profile.location || '',
    mentalHealthGoals: (profile.mentalHealthGoals || []).join(', '),
    preferredTherapyTypes: (profile.preferredTherapyTypes || []).join(', '),
    qualifications: profile.therapistProfile?.qualifications || '',
    languages: (profile.therapistProfile?.languages || []).join(', '),
    hourlyRate: profile.therapistProfile?.hourlyRate || profile.therapistProfile?.sessionPricing || 0,
  }));

  const submit = async (e) => {
    e.preventDefault();
    const hourlyRate = Number(form.hourlyRate) || 0;

    await updateMutation.mutateAsync({
      ...form,
      mentalHealthGoals: form.mentalHealthGoals
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      preferredTherapyTypes: form.preferredTherapyTypes
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      languages: form.languages
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      hourlyRate,
      sessionPricing: hourlyRate,
    });

    if (photoFile) {
      await uploadMutation.mutateAsync(photoFile);
      setPhotoFile(null);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Input label="Full Name" value={form.fullName} onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))} />
      <Input label="Username" value={form.username} onChange={(e) => setForm((current) => ({ ...current, username: e.target.value.toLowerCase() }))} />
      <Input label="Location" value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} />
      <Textarea label="Bio" value={form.bio} onChange={(e) => setForm((current) => ({ ...current, bio: e.target.value }))} />
      <Input label="Mental Health Goals (comma-separated)" value={form.mentalHealthGoals} onChange={(e) => setForm((current) => ({ ...current, mentalHealthGoals: e.target.value }))} />
      <Input label="Preferred Therapy Types (comma-separated)" value={form.preferredTherapyTypes} onChange={(e) => setForm((current) => ({ ...current, preferredTherapyTypes: e.target.value }))} />

      {profile.userType === 'therapist' && (
        <>
          <Textarea label="Qualifications" value={form.qualifications} onChange={(e) => setForm((current) => ({ ...current, qualifications: e.target.value }))} />
          <Input label="Languages (comma-separated)" value={form.languages} onChange={(e) => setForm((current) => ({ ...current, languages: e.target.value }))} />
          <Input type="number" label="Hourly Rate" value={form.hourlyRate} onChange={(e) => setForm((current) => ({ ...current, hourlyRate: e.target.value }))} />
        </>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Profile Photo</label>
        <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
      </div>

      <Button type="submit" disabled={updateMutation.isPending || uploadMutation.isPending}>
        {updateMutation.isPending || uploadMutation.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}

function EditProfileContent() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  const { data } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileService.getMyProfile,
  });

  const profile = data?.data?.profile;

  const updateMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (result) => {
      const updatedProfile = result?.data?.profile || result?.profile || result;
      updateUser({
        fullName: updatedProfile.fullName,
        username: updatedProfile.username,
        bio: updatedProfile.bio,
        location: updatedProfile.location,
        email: updatedProfile.email,
        avatarUrl: updatedProfile.avatarUrl,
      });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      toast.success('Profile updated');
    },
    onError: (error) => toast.error(String(error || 'Failed to update profile')),
  });

  const uploadMutation = useMutation({
    mutationFn: profileService.uploadPhoto,
    onSuccess: (result) => {
      const photoUrl = result?.data?.photoUrl || result?.photoUrl;
      if (photoUrl) {
        updateUser({ avatarUrl: photoUrl });
      }
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      toast.success('Photo uploaded');
    },
    onError: (error) => toast.error(String(error || 'Failed to upload photo')),
  });

  if (!profile) return <p className="px-4 py-10 text-sm text-slate-600">Loading...</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileEditForm
            key={profile._id}
            profile={profile}
            updateMutation={updateMutation}
            uploadMutation={uploadMutation}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfileEditPage() {
  return (
    <ProtectedRoute>
      <EditProfileContent />
    </ProtectedRoute>
  );
}
