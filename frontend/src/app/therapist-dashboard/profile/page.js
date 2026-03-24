"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';
import api from '@/lib/api';
import { profileService } from '@/services/profileService';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = [
  'anxiety', 'depression', 'relationships', 'stress',
  'trauma', 'addiction', 'grief', 'self-esteem', 'career', 'family',
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function TherapistProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [formData, setFormData] = useState({
    qualifications: '',
    experienceYears: 0,
    hourlyRate: 0,
    specializations: [],
    availability: { days: [], timeStart: '09:00', timeEnd: '17:00' },
  });

  const toSafeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/therapists/profile');
        const data = response?.data?.data || {};

        setFormData({
          qualifications: data.qualifications || '',
          experienceYears: toSafeNumber(data.experienceYears, 0),
          hourlyRate: toSafeNumber(data.hourlyRate, 0),
          specializations: Array.isArray(data.specializations) ? data.specializations : [],
          availability: data.availability || { days: [], timeStart: '09:00', timeEnd: '17:00' },
        });
      } catch (error) {
        console.error('Failed to load therapist profile', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user?.userType === 'therapist') fetchProfile();
  }, [user]);

  const getErrorMessage = (error, fallback) => {
    if (typeof error === 'string') return error;
    return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;
  };

  const handlePhotoUpload = async (file) => {
    setUploadingPhoto(true);
    try {
      const result = await profileService.uploadPhoto(file);
      const photoUrl = result?.data?.photoUrl || result?.photoUrl;

      if (photoUrl) {
        setAvatarUrl(photoUrl);
        updateUser({ avatarUrl: photoUrl });
      }

      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to upload profile photo'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/therapists/profile', {
        ...formData,
        experienceYears: toSafeNumber(formData.experienceYears, 0),
        hourlyRate: toSafeNumber(formData.hourlyRate, 0),
      });
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  const toggleSpec = (spec) =>
    setFormData((p) => ({
      ...p,
      specializations: p.specializations.includes(spec)
        ? p.specializations.filter((s) => s !== spec)
        : [...p.specializations, spec],
    }));

  const toggleDay = (day) =>
    setFormData((p) => ({
      ...p,
      availability: {
        ...p.availability,
        days: p.availability.days.includes(day)
          ? p.availability.days.filter((d) => d !== day)
          : [...p.availability.days, day],
      },
    }));

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-h3 font-bold text-charcoal">Professional Profile</h1>
          <p className="mt-1 text-base text-text-muted">Manage your qualifications, specializations, and availability.</p>
        </div>
        <Link href="/therapist-dashboard">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Upload a professional photo for your public therapist profile.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex items-center gap-4">
            <Avatar
              name={user?.fullName || user?.email || 'Therapist'}
              src={avatarUrl || user?.avatarUrl}
              size={72}
            />
            <div className="space-y-2">
              <label htmlFor="therapist-photo-upload" className="inline-flex cursor-pointer">
                <Button type="button" variant="outline" size="sm" isLoading={uploadingPhoto}>
                  Change Photo
                </Button>
              </label>
              <input
                id="therapist-photo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                disabled={uploadingPhoto}
              />
              <p className="text-xs text-text-muted">JPG, PNG, GIF, or WEBP. Max 2MB.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Qualifications & Rates</CardTitle>
            <CardDescription>Your professional credentials and pricing.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <Textarea
              label="Qualifications"
              placeholder="List your degrees, certifications, and licenses..."
              value={formData.qualifications}
              onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
              rows={4}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Years of Experience"
                type="number"
                min="0"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: toSafeNumber(e.target.value, 0) })}
              />
              <Input
                label="Hourly Rate ($)"
                type="number"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: toSafeNumber(e.target.value, 0) })}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Specializations</CardTitle>
            <CardDescription>Select the areas you specialize in.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {SPECIALIZATIONS.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpec(spec)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                    formData.specializations.includes(spec)
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface text-text-muted border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Availability</CardTitle>
            <CardDescription>Set your working days and hours.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-charcoal mb-3">Available Days</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                      formData.availability.days.includes(day)
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface text-text-muted border-border hover:border-primary hover:text-primary'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Start Time"
                type="time"
                value={formData.availability.timeStart}
                onChange={(e) => setFormData({ ...formData, availability: { ...formData.availability, timeStart: e.target.value } })}
              />
              <Input
                label="End Time"
                type="time"
                value={formData.availability.timeEnd}
                onChange={(e) => setFormData({ ...formData, availability: { ...formData.availability, timeEnd: e.target.value } })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/therapist-dashboard">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} isLoading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
