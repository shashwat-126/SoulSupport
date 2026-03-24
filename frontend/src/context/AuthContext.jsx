'use client';

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const didInitRef = useRef(false);

  const resolvePostAuthRoute = useCallback((currentUser) => {
    if (currentUser?.userType === 'admin') {
      return '/admin';
    }

    if (currentUser?.userType === 'therapist') {
      return '/therapist-dashboard';
    }

    return '/dashboard';
  }, []);

  useEffect(() => {
    if (didInitRef.current) {
      return;
    }

    didInitRef.current = true;

    const isRateLimitError = (error) => {
      const message = error instanceof Error ? error.message : String(error || '');
      return message.includes('429');
    };

    const wait = (ms) => new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

    const loadUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          let payload;
          try {
            payload = await authService.getCurrentUser();
          } catch (error) {
            if (isRateLimitError(error)) {
              await wait(1200);
              payload = await authService.getCurrentUser();
            } else {
              throw error;
            }
          }

          setUser(payload.user);
        }
      } catch (error) {
        if (isRateLimitError(error)) {
          console.warn('Auth check rate-limited. Please refresh in a moment if access is blocked.');
        } else {
          console.error('Failed to load user:', error);
          authService.logout();
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (email, password) => {
    const payload = await authService.login(email, password);
    setUser(payload.user);

    router.push(resolvePostAuthRoute(payload.user));
  }, [resolvePostAuthRoute, router]);

  const register = useCallback(async (data) => {
    const payload = await authService.register(data);
    setUser(payload.user);
    router.push(resolvePostAuthRoute(payload.user));
  }, [resolvePostAuthRoute, router]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((userData) => {
    setUser((currentUser) => (currentUser ? { ...currentUser, ...userData } : currentUser));
  }, []);

  const value = useMemo(() => {
    return {
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: !!user,
      isTherapist: user?.userType === 'therapist',
      isAdmin: user?.userType === 'admin',
    };
  }, [loading, login, logout, register, updateUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
