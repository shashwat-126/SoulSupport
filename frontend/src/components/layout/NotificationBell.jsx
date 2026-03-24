"use client";

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellDot,
  CalendarCheck2,
  CheckCheck,
  MessageSquare,
  Trash2,
  XCircle,
  ArrowUpRight,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

function typeMeta(type) {
  const map = {
    session_booked: {
      label: 'Session booked',
      tone: 'text-emerald-700 bg-emerald-100',
      icon: CalendarCheck2,
    },
    session_confirmed: {
      label: 'Session confirmed',
      tone: 'text-sky-700 bg-sky-100',
      icon: CheckCheck,
    },
    session_cancelled: {
      label: 'Session cancelled',
      tone: 'text-rose-700 bg-rose-100',
      icon: XCircle,
    },
    new_review: {
      label: 'New review',
      tone: 'text-amber-700 bg-amber-100',
      icon: MessageSquare,
    },
  };

  return map[type] ?? { label: 'Notification', tone: 'text-slate-700 bg-slate-100', icon: BellDot };
}

function getNotificationHref(notification, isTherapist) {
  if (notification.relatedEntityType === 'review') {
    return '/therapist-dashboard/reviews';
  }

  if (notification.relatedEntityType === 'session') {
    const base = isTherapist ? '/therapist-dashboard/sessions' : '/dashboard/sessions';
    return notification.relatedEntityId
      ? `${base}?highlight=${notification.relatedEntityId}`
      : base;
  }

  if (notification.relatedEntityType === 'post') {
    return '/forum';
  }

  return isTherapist ? '/therapist-dashboard' : '/dashboard';
}

function NotificationBellComponent() {
  const router = useRouter();
  const { isTherapist } = useAuth();
  const { notifications, unreadCount, markRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);
  const [activeAction, setActiveAction] = useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = useCallback(async (id) => {
    setActiveAction(`read:${id}`);
    try {
      await markRead.mutateAsync(id);
    } finally {
      setActiveAction('');
    }
  }, [markRead]);

  const handleOpenNotification = useCallback(async (notification) => {
    const href = getNotificationHref(notification, isTherapist);

    setActiveAction(`open:${notification._id}`);
    try {
      if (!notification.isRead) {
        await markRead.mutateAsync(notification._id);
      }
      setOpen(false);
      router.push(href);
    } finally {
      setActiveAction('');
    }
  }, [isTherapist, markRead, router]);

  const handleDelete = useCallback(async (id) => {
    setActiveAction(`delete:${id}`);
    try {
      await remove.mutateAsync(id);
    } finally {
      setActiveAction('');
    }
  }, [remove]);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-alt transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bell className="h-5 w-5 text-text-secondary" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[32rem] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 z-50">
          <div className="sticky top-0 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-charcoal text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary font-semibold">{unreadCount} unread</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-text-muted">
              <BellDot className="mx-auto mb-3 h-6 w-6 text-slate-300" />
              No notifications yet
            </div>
          ) : (
            <ul className="p-2">
              {notifications.map((n) => {
                const meta = typeMeta(n.type);
                const TypeIcon = meta.icon;

                return (
                <li
                  key={n._id}
                  className={`mb-2 rounded-xl border p-3 last:mb-0 ${
                    !n.isRead
                      ? 'border-primary/25 bg-primary/[0.04] shadow-sm'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full ${meta.tone}`}>
                      <TypeIcon className="h-4 w-4" strokeWidth={2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate text-xs font-semibold text-slate-700">{meta.label}</p>
                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}
                      </div>
                      <p className="text-sm font-medium text-charcoal leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[11px] text-text-muted">{formatDate(n.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    {!n.isRead && (
                      <button
                        title="Mark as read"
                        onClick={() => handleMarkRead(n._id)}
                        disabled={activeAction === `read:${n._id}` || activeAction === `open:${n._id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark read
                      </button>
                    )}

                    <button
                      title="Open"
                      onClick={() => handleOpenNotification(n)}
                      disabled={activeAction === `open:${n._id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Open
                    </button>

                    <button
                      title="Delete"
                      onClick={() => handleDelete(n._id)}
                      disabled={activeAction === `delete:${n._id}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export const NotificationBell = memo(NotificationBellComponent);
