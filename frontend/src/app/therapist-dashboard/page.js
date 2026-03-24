"use client";

import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { useState, useEffect, useMemo } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import api from '@/lib/api';

const UPCOMING_SESSION_STATUSES = new Set(['pending', 'confirmed']);

export default function TherapistDashboardPage() {
  const { user } = useAuth();
  const { list } = useSessions(
    { role: 'therapist' },
    { refetchOnWindowFocus: false }
  );
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const sessions = useMemo(
    () => list.data?.data?.sessions ?? [],
    [list.data]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = sessions.filter(s =>
      UPCOMING_SESSION_STATUSES.has(s.status) && new Date(s.sessionDate) > now
    ).length;
    const completed = sessions.filter(s => s.status === 'completed').length;
    const pending = sessions.filter(s => s.status === 'pending').length;
    const revenue = completed * (profile?.hourlyRate || 0);
    return { upcoming, completed, pending, revenue };
  }, [sessions, profile]);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const response = await api.get('/therapists/profile');
        if (mounted) setProfile(response.data?.data?.therapist ?? null);
      } catch (error) {
        console.error('Failed to fetch therapist dashboard profile', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (user?.userType === 'therapist') fetchProfile();
    else setLoading(false);
    return () => { mounted = false; };
  }, [user]);

  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter(s => UPCOMING_SESSION_STATUSES.has(s.status) && new Date(s.sessionDate) > now)
      .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));
  }, [sessions]);

  if (loading || list.isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-h3 sm:text-h2 font-bold text-charcoal">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Therapist'}!
          </h1>
          <p className="mt-1 text-base text-text-secondary">
            Manage your schedule, clients, and professional profile.
          </p>
        </div>
        <Link href="/therapist-dashboard/profile">
          <Button variant="outline" size="sm">Edit Profile</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Upcoming', value: stats.upcoming, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', bg: 'bg-primary-soft', fg: 'text-primary' },
          { label: 'Pending Requests', value: stats.pending, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-coral-50', fg: 'text-coral' },
          { label: 'Completed', value: stats.completed, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-sage-50', fg: 'text-sage' },
          { label: 'Revenue', value: `$${stats.revenue}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-lavender-50', fg: 'text-lavender' },
        ].map((stat) => (
          <Card key={stat.label} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.fg}`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon}/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-muted uppercase tracking-wider">{stat.label}</p>
                  <p className="mt-1 text-3xl font-heading font-bold text-charcoal">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Summary */}
          {profile && (
            <Card>
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.specializations?.length > 0 ? (
                        profile.specializations.map((spec) => (
                          <Badge key={spec} tone="primary" className="capitalize">{spec}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-text-muted">Not set</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Hourly Rate</p>
                    <p className="text-lg font-bold text-charcoal">${profile.hourlyRate || 0}/hr</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-charcoal">{profile.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-text-muted">({profile.totalReviews || 0} reviews)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Clients who have booked sessions with you.</CardDescription>
              </div>
              <Link href="/therapist-dashboard/sessions">
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary-soft">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              {list.error && <ErrorMessage message={String(list.error)} />}
              {upcomingSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-alt/30 rounded-xl border border-dashed border-border">
                  <div className="w-12 h-12 rounded-full bg-surface mb-3 flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <p className="text-sm font-semibold text-charcoal">No sessions scheduled yet</p>
                  <p className="text-sm text-text-muted max-w-xs mt-1">When clients book sessions with you, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.slice(0, 5).map((session) => {
                    const userProfileId =
                      typeof session.userId === 'string'
                        ? session.userId
                        : session.userId?._id;

                    return (
                    <div key={session._id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-surface-alt/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary-soft flex items-center justify-center text-primary font-bold">
                          {(session.user?.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-charcoal group-hover:text-primary transition-colors">
                            {session.user?.name || 'Client'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge tone={session.status === 'confirmed' ? 'success' : 'warning'}>{session.status}</Badge>
                            <span className="text-sm text-text-secondary flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                              {new Date(session.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-sm text-text-secondary flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              {new Date(session.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {session.status === 'confirmed' ? (
                        <div className="flex w-full sm:w-auto gap-2">
                          {userProfileId && (
                            <Link href={`/profile/${userProfileId}`}>
                              <Button size="sm" variant="outline" className="w-full sm:w-auto">View Profile</Button>
                            </Link>
                          )}
                          <Link href={`/session/${session._id}`}>
                            <Button size="sm" className="w-full sm:w-auto">Join Meeting</Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="flex w-full sm:w-auto gap-2">
                          {userProfileId && (
                            <Link href={`/profile/${userProfileId}`}>
                              <Button size="sm" variant="outline" className="w-full sm:w-auto">View Profile</Button>
                            </Link>
                          )}
                          <Link href="/therapist-dashboard/sessions">
                            <Button size="sm" variant="outline" className="w-full sm:w-auto">Manage</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Quick Actions</p>
              <div className="flex flex-col gap-2">
                <Link href="/therapist-dashboard/sessions">
                  <Button size="sm" className="w-full justify-center">Manage Sessions</Button>
                </Link>
                <Link href="/therapist-dashboard/reviews">
                  <Button size="sm" variant="outline" className="w-full justify-center">View Reviews</Button>
                </Link>
                <Link href="/therapist-dashboard/assistant">
                  <Button size="sm" variant="outline" className="w-full justify-center">AI Assistant</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-[#0f4637] text-white border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg font-bold mb-2">Professional Resources</h3>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                Access clinical guidelines, continuing education materials, and peer support tools.
              </p>
              <Link href="/resources">
                <Button className="w-full bg-white text-primary hover:bg-white/90">
                  Browse Resources
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
