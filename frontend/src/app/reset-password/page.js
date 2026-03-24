"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenState, setTokenState] = useState('validating'); // 'validating' | 'valid' | 'invalid'

  useEffect(() => {
    if (!token) {
      setTokenState('invalid');
      return;
    }
    authService.validateResetToken(token)
      .then(() => setTokenState('valid'))
      .catch(() => setTokenState('invalid'));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Missing token');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset');
      router.push('/login');
    } catch (err) {
      toast.error(err || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 text-charcoal">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-border">
          {tokenState === 'validating' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Spinner />
              <p className="text-sm text-text-muted">Validating your link…</p>
            </div>
          )}

          {tokenState === 'invalid' && (
            <div className="space-y-3 text-center">
              <p className="text-2xl">⚠️</p>
              <h1 className="text-xl font-bold text-charcoal">Link expired or invalid</h1>
              <p className="text-sm text-text-secondary">
                This password reset link is no longer valid. Please request a new one.
              </p>
              <Button className="w-full" onClick={() => router.push('/forgot-password')}>
                Request new link
              </Button>
            </div>
          )}

          {tokenState === 'valid' && (
            <>
              <h1 className="text-2xl font-bold text-charcoal">Reset password</h1>
              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
