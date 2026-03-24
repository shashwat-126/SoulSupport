"use client";

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, ShieldCheck, UserCheck, UserRoundX, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn, formatDate } from '@/lib/utils';

function StatCard({ title, value, helper, icon: Icon, tone }) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="flex items-start gap-4 p-6">
        <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl', tone)}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-2 font-heading text-3xl font-bold text-charcoal">{value}</p>
          <p className="mt-1 text-sm text-text-muted">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const analytics = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => adminService.getAnalytics(),
    refetchOnWindowFocus: false,
  });

  const pendingTherapists = useQuery({
    queryKey: ['admin', 'pending-therapists'],
    queryFn: () => adminService.getUnverifiedTherapists({ limit: 8 }),
    refetchOnWindowFocus: false,
  });

  const users = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => adminService.getUsers({ limit: 10, search: search.trim() || undefined }),
    refetchOnWindowFocus: false,
  });

  const verifyTherapist = useMutation({
    mutationFn: ({ profileId, isVerified }) => adminService.setTherapistVerified(profileId, isVerified),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-therapists'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast.success(variables.isVerified ? 'Therapist verified' : 'Therapist status updated');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update therapist');
    },
  });

  const setUserActive = useMutation({
    mutationFn: ({ userId, isActive }) => adminService.setUserActive(userId, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast.success(variables.isActive ? 'User activated' : 'User deactivated');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update user');
    },
  });

  const deleteUser = useMutation({
    mutationFn: (userId) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast.success('User deleted');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to delete user');
    },
  });

  const stats = analytics.data?.data ?? {};
  const pendingProfiles = pendingTherapists.data?.data?.profiles ?? [];
  const userRows = users.data?.data?.users ?? [];

  const quickStats = useMemo(() => {
    return [
      {
        title: 'Active users',
        value: stats.users?.total ?? 0,
        helper: 'Currently active client accounts',
        icon: Users,
        tone: 'bg-sky-100 text-sky-700',
      },
      {
        title: 'Therapists',
        value: stats.therapists?.total ?? 0,
        helper: `${stats.therapists?.verified ?? 0} verified, ${stats.therapists?.pending ?? 0} pending`,
        icon: ShieldCheck,
        tone: 'bg-emerald-100 text-emerald-700',
      },
      {
        title: 'Sessions',
        value: stats.sessions?.total ?? 0,
        helper: `${stats.sessions?.completed ?? 0} completed`,
        icon: Activity,
        tone: 'bg-amber-100 text-amber-700',
      },
      {
        title: 'Reviews',
        value: stats.reviews?.total ?? 0,
        helper: 'Platform feedback submitted',
        icon: UserCheck,
        tone: 'bg-violet-100 text-violet-700',
      },
    ];
  }, [stats.reviews?.total, stats.sessions?.completed, stats.sessions?.total, stats.therapists?.pending, stats.therapists?.total, stats.therapists?.verified, stats.users?.total]);

  const handleDeleteUser = (userId) => {
    const shouldDelete = window.confirm('Delete this user and all associated data? This cannot be undone.');
    if (!shouldDelete) {
      return;
    }
    deleteUser.mutate(userId);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#f0fdf4_100%)] p-8 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Admin console</p>
            <h1 className="mt-2 font-heading text-4xl font-bold text-charcoal">Platform control center</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Review therapist approvals, monitor platform health, and manage account access from one place.
            </p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-charcoal">{user?.fullName || user?.email || 'Admin'}</p>
          </div>
        </div>
      </section>

      {analytics.isLoading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner label="Loading admin dashboard..." />
        </div>
      ) : analytics.error ? (
        <ErrorMessage message={analytics.error?.message || String(analytics.error)} />
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.1fr,1.4fr]">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle>Therapist verification queue</CardTitle>
            <CardDescription>Approve newly registered therapists so they become visible on the public directory.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {pendingTherapists.isLoading && <LoadingSpinner label="Loading pending therapists..." />}
            {pendingTherapists.error && (
              <ErrorMessage message={pendingTherapists.error?.message || String(pendingTherapists.error)} />
            )}
            {!pendingTherapists.isLoading && !pendingTherapists.error && pendingProfiles.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
                No therapists are waiting for verification.
              </div>
            )}
            {!pendingTherapists.isLoading && !pendingTherapists.error && pendingProfiles.length > 0 && (
              <div className="space-y-3">
                {pendingProfiles.map((profile) => (
                  <div key={profile._id} className="rounded-2xl border border-slate-200 p-4 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-charcoal">{profile.userId?.fullName || 'Unnamed therapist'}</p>
                        <p className="text-sm text-slate-600">{profile.userId?.email || 'No email available'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge tone="warning">Awaiting verification</Badge>
                          <span className="text-xs text-slate-500">Joined {formatDate(profile.createdAt)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => verifyTherapist.mutate({ profileId: profile._id, isVerified: true })}
                        isLoading={verifyTherapist.isPending && verifyTherapist.variables?.profileId === profile._id}
                      >
                        Verify therapist
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle>User management</CardTitle>
            <CardDescription>Search users, toggle access, and remove accounts that should no longer exist.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 sm:max-w-xs"
              />
              <Badge tone="neutral">{userRows.length} shown</Badge>
            </div>

            {users.isLoading && <LoadingSpinner label="Loading users..." />}
            {users.error && <ErrorMessage message={users.error?.message || String(users.error)} />}

            {!users.isLoading && !users.error && userRows.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
                No users matched this search.
              </div>
            )}

            {!users.isLoading && !users.error && userRows.length > 0 && (
              <div className="space-y-3">
                {userRows.map((row) => {
                  const isCurrentAdmin = row._id === user?._id;
                  const isToggling = setUserActive.isPending && setUserActive.variables?.userId === row._id;
                  const isDeleting = deleteUser.isPending && deleteUser.variables === row._id;

                  return (
                    <div key={row._id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold text-charcoal">{row.fullName}</p>
                            <Badge tone={row.isActive ? 'success' : 'danger'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
                            <Badge tone="info" className="capitalize">{row.userType}</Badge>
                          </div>
                          <p className="mt-1 truncate text-sm text-slate-600">{row.email}</p>
                          <p className="mt-2 text-xs text-slate-500">Joined {formatDate(row.createdAt)}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant={row.isActive ? 'outline' : 'primary'}
                            onClick={() => setUserActive.mutate({ userId: row._id, isActive: !row.isActive })}
                            isLoading={isToggling}
                            disabled={isCurrentAdmin}
                          >
                            {row.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteUser(row._id)}
                            isLoading={isDeleting}
                            disabled={isCurrentAdmin}
                            className="inline-flex items-center gap-2"
                          >
                            <UserRoundX className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}