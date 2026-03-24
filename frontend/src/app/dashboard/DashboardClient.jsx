'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { useTherapists } from '@/hooks/useTherapists';
import { useForum } from '@/hooks/useForum';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Link from 'next/link';

const UPCOMING_SESSION_STATUSES = new Set(['pending', 'confirmed']);
const ARCHIVED_SESSION_STATUSES = new Set([
  'completed',
  'cancelled_by_user',
  'cancelled_by_therapist',
  'expired',
]);

export default function DashboardContent() {
  const { user } = useAuth();
  const liveQueryOptions = {
    refetchOnWindowFocus: false,
  };

  const { list: sessions } = useSessions({ limit: 200 }, liveQueryOptions);
  const sessionList = sessions?.data?.data?.sessions ?? [];

  const upcomingSessionList = sessionList.filter(
    (s) => UPCOMING_SESSION_STATUSES.has(s.status) && new Date(s.sessionDate) > new Date()
  );
  const pastSessionList = sessionList.filter(
    (s) =>
      ARCHIVED_SESSION_STATUSES.has(s.status) ||
      new Date(s.sessionDate) <= new Date()
  );
  const upcomingSessions = upcomingSessionList.length;
  const completedSessions = sessionList.filter((s) => s.status === 'completed').length;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="font-heading text-h3 sm:text-h2 font-bold text-charcoal">
          Welcome back, {user?.fullName?.split(' ')[0] || 'User'}!
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Track your progress and manage your therapy journey.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-muted uppercase tracking-wider">Upcoming Sessions</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-3xl font-heading font-bold text-charcoal">{upcomingSessions}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sage-50 text-sage">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-muted uppercase tracking-wider">Completed Sessions</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-3xl font-heading font-bold text-charcoal">{completedSessions}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col h-full justify-center">
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <Link href="/therapists" className="w-full">
                  <Button size="sm" className="w-full justify-center">Find Therapist</Button>
                </Link>
                <Link href="/forum" className="w-full">
                  <Button size="sm" variant="outline" className="w-full justify-center">Community</Button>
                </Link>
                <Link href="/dashboard/assistant" className="w-full">
                  <Button size="sm" variant="outline" className="w-full justify-center">Talk to SoulBot</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your next scheduled appointments.</CardDescription>
              </div>
              <Link href="/dashboard/sessions">
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary-soft">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              {sessions.isLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="md" />
                </div>
              ) : upcomingSessions === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-alt/30 rounded-xl border border-dashed border-border">
                  <div className="w-12 h-12 rounded-full bg-surface mb-3 flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <p className="text-sm font-semibold text-charcoal">No upcoming sessions</p>
                  <p className="text-sm text-text-muted max-w-[250px] mb-4 mt-1">Get the support you need by scheduling time with a therapist.</p>
                  <Link href="/therapists">
                    <Button>Book a Session</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessionList.slice(0, 3).map((session) => (
                    <div key={session._id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-surface-alt/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary-soft flex items-center justify-center text-primary font-bold">
                          {session.therapist?.user?.fullName?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <p className="font-semibold text-charcoal group-hover:text-primary transition-colors">
                            {session.therapist?.user?.fullName || 'Therapist'}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge tone={session.status === 'confirmed' ? 'success' : 'warning'}>{session.status}</Badge>
                            <span className="text-sm text-text-secondary flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                              {new Date(session.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                            </span>
                            <span className="text-sm text-text-secondary flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              {new Date(session.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {session.status === 'confirmed' ? (
                        <Link href={`/session/${session._id}`}>
                          <Button size="sm" className="w-full sm:w-auto">Join Meeting</Button>
                        </Link>
                      ) : (
                        <Link href="/dashboard/sessions">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto">Manage</Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div>
                <CardTitle>Past Sessions</CardTitle>
                <CardDescription>Review completed and cancelled sessions.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {pastSessionList.length === 0 ? (
                <p className="text-sm text-text-muted">No past sessions yet.</p>
              ) : (
                <div className="space-y-3">
                  {pastSessionList.slice(0, 4).map((session) => (
                    <div key={session._id} className="flex flex-col gap-3 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-charcoal">{session.therapist?.name || 'Therapist'}</p>
                        <p className="text-xs text-text-muted">{new Date(session.sessionDate).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={session.status === 'completed' ? 'success' : 'warning'}>{session.status}</Badge>
                        {session.status === 'completed' && (
                          <Link href={`/session/${session._id}`}>
                            <Button size="sm" variant="outline">Review</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Space (Resources/Tips) */}
        <div className="space-y-6">
          <Card className="border-border/70 hover:border-primary/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <h3 className="font-heading text-lg font-bold text-charcoal">SoulBot</h3>
              </div>
              <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                Your mental wellness companion is always here to listen, provide support, and help you through challenges.
              </p>
              <Link href="/dashboard/assistant">
                <Button className="w-full" variant="outline">
                  Start Chatting
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-[#0f4637] text-white border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg font-bold mb-2">Need immediate help?</h3>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                If you are in crisis, please connect with a hot line or emergency service right away.
              </p>
              <Link href="/resources">
                <Button className="w-full bg-white text-primary hover:bg-white/90">
                  Crisis Resources
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
