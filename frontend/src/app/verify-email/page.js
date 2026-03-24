"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const hasToken = Boolean(token);

  const [status, setStatus] = useState(hasToken ? 'loading' : 'error'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState(
    hasToken ? '' : 'No verification token found. Please check your email link.'
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;
    let redirectTimeout;

    authService
      .verifyEmail(token)
      .then(() => {
        if (isCancelled) return;
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        // Redirect to login after 3 seconds
        redirectTimeout = setTimeout(() => router.push('/login'), 3000);
      })
      .catch((err) => {
        if (isCancelled) return;
        setStatus('error');
        setMessage(
          err?.response?.data?.message ||
            'This verification link is invalid or has expired. Please request a new one.'
        );
      });

    return () => {
      isCancelled = true;
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [token, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="mx-auto max-w-md w-full">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-border text-center space-y-4">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-charcoal">Verifying your email…</h1>
              <p className="text-sm text-text-muted">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-charcoal">Email Verified!</h1>
              <p className="text-sm text-text-muted">{message}</p>
              <p className="text-xs text-text-muted">Redirecting you to login…</p>
              <Link href="/login">
                <Button className="w-full mt-2">Go to Login</Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-charcoal">Verification Failed</h1>
              <p className="text-sm text-text-muted">{message}</p>
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login">
                  <Button className="w-full">Go to Login</Button>
                </Link>
                <Link href="/forgot-password">
                  <Button variant="outline" className="w-full">Resend Verification</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
