"use client";

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { PROFILE_QUERY_KEY, ME_QUERY_KEY } from '@/lib/queryKeys';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

function ProfileEditor({ profile, isTherapist }) {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  const getErrorMessage = (error, fallback) => {
    if (typeof error === 'string') return error;
    return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;
  };

  const [form, setForm] = useState(() => ({
    fullName: profile.fullName || '',
    username: profile.username || '',
    bio: profile.bio || '',
    location: profile.location || '',
    mentalHealthGoals: (profile.mentalHealthGoals || []).join(', '),
    preferredTherapyTypes: (profile.preferredTherapyTypes || []).join(', '),
  }));
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const hasChanges = useMemo(() => {
    return (
      form.fullName !== (profile.fullName || '') ||
      form.username !== (profile.username || '') ||
      form.bio !== (profile.bio || '') ||
      form.location !== (profile.location || '') ||
      form.mentalHealthGoals !== (profile.mentalHealthGoals || []).join(', ') ||
      form.preferredTherapyTypes !== (profile.preferredTherapyTypes || []).join(', ')
    );
  }, [form, profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName,
        username: form.username || undefined,
        bio: form.bio,
        location: form.location,
      };
      if (!isTherapist) {
        payload.mentalHealthGoals = form.mentalHealthGoals
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        payload.preferredTherapyTypes = form.preferredTherapyTypes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      const result = await profileService.updateProfile(payload);
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
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (file) => {
    setUploadingPhoto(true);
    try {
      const result = await profileService.uploadPhoto(file);
      const photoUrl = result?.data?.photoUrl || result?.photoUrl;
      if (photoUrl) {
        updateUser({ avatarUrl: photoUrl });
      }
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      toast.success('Photo updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to upload photo'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your name, bio, and details visible to the community.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <Input
              label="Full Name"
              placeholder="e.g. Jane Doe"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
            />
            <Input
              label="Username"
              placeholder="e.g. janedoe"
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              helperText="3-30 characters, letters, numbers, _, ., -"
            />
            <Textarea
              label="Bio"
              placeholder="Share a little bit about yourself..."
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              helperText={`${form.bio.length}/500 characters`}
              maxLength={500}
            />
            <Input
              label="Location"
              placeholder="e.g. New York, NY"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
            />
          </CardContent>
        </Card>

        {!isTherapist && (
          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle>Wellness Preferences</CardTitle>
              <CardDescription>Help us personalize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <Input
                label="Mental Health Goals"
                placeholder="e.g. anxiety management, mindfulness, stress reduction"
                value={form.mentalHealthGoals}
                onChange={(e) => update('mentalHealthGoals', e.target.value)}
                helperText="Separate multiple goals with commas."
              />
              <Input
                label="Preferred Therapy Types"
                placeholder="e.g. CBT, talk therapy, art therapy"
                value={form.preferredTherapyTypes}
                onChange={(e) => update('preferredTherapyTypes', e.target.value)}
                helperText="Separate multiple types with commas."
              />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            isLoading={saving}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="relative group mb-6">
              <Avatar name={profile.fullName || profile.email} src={profile.avatarUrl} size={96} className="ring-4 ring-primary-soft shadow-md" />
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 h-8 w-8 bg-surface border border-border shadow-sm rounded-full flex items-center justify-center cursor-pointer text-text-muted hover:text-primary hover:border-primary transition-colors">
                {uploadingPhoto ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
                  disabled={uploadingPhoto}
                />
              </label>
            </div>

            <div className="w-full space-y-4">
              <div className="bg-surface-alt/50 rounded-xl p-3 border border-border/50">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-sm font-medium text-charcoal">{profile.email}</p>
              </div>
              <div className="bg-surface-alt/50 rounded-xl p-3 border border-border/50">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Account Role</p>
                <Badge tone="primary" className="mt-1 capitalize">{profile.userType}</Badge>
              </div>
              {profile.createdAt && (
                <div className="bg-surface-alt/50 rounded-xl p-3 border border-border/50">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Member Since</p>
                  <p className="text-sm font-medium text-charcoal">
                    {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardProfilePage() {
  const { user } = useAuth();
  const isTherapist = user?.userType === 'therapist';

  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileService.getMyProfile,
    staleTime: 2 * 60 * 1000,
  });

  const profile = profileQuery.data?.data?.profile || profileQuery.data?.profile;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-heading text-h3 font-bold text-charcoal">Profile Settings</h1>
        <p className="mt-1 text-base text-text-muted">Manage your personal information and account details.</p>
      </div>

      {profileQuery.isLoading && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      )}

      {profileQuery.error && (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
          <ErrorMessage message={String(profileQuery.error)} />
        </div>
      )}

      {profile && (
        <ProfileEditor
          key={profile._id}
          profile={profile}
          isTherapist={isTherapist}
        />
      )}
    </div>
  );
}
