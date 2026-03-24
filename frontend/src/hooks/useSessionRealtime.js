"use client";

import { useEffect } from 'react';
import { getAuthToken } from '@/lib/authToken';

function getRealtimeUrl(token) {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
  return `${apiBase}/sessions/stream?token=${encodeURIComponent(token)}`;
}

export function useSessionRealtime({ onSessionUpdate, onSlotUpdate } = {}) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const token = getAuthToken();
    if (!token) {
      return undefined;
    }

    const stream = new EventSource(getRealtimeUrl(token));

    const handleSessionUpdate = (event) => {
      if (!onSessionUpdate) {
        return;
      }

      try {
        onSessionUpdate(JSON.parse(event.data));
      } catch {
        // Ignore malformed realtime payloads.
      }
    };

    const handleSlotUpdate = (event) => {
      if (!onSlotUpdate) {
        return;
      }

      try {
        onSlotUpdate(JSON.parse(event.data));
      } catch {
        // Ignore malformed realtime payloads.
      }
    };

    const handleAuthError = () => {
      stream.close();
    };

    stream.addEventListener('session.updated', handleSessionUpdate);
    stream.addEventListener('slot.updated', handleSlotUpdate);
    stream.addEventListener('auth.error', handleAuthError);

    return () => {
      stream.removeEventListener('session.updated', handleSessionUpdate);
      stream.removeEventListener('slot.updated', handleSlotUpdate);
      stream.removeEventListener('auth.error', handleAuthError);
      stream.close();
    };
  }, [onSessionUpdate, onSlotUpdate]);
}
