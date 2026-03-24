'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error) || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col md:flex-row bg-background">
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-md bg-surface border border-border/50 rounded-3xl p-8 sm:p-12 shadow-card relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-primary-soft rounded-full opacity-50 blur-2xl"></div>
          
          <div className="text-center mb-8 relative z-10">
            <h1 className="font-heading text-h3 font-bold text-charcoal tracking-tight sm:text-h2">
              Welcome back
            </h1>
            <p className="mt-3 text-base text-text-secondary">
              Sign in to continue your secure session.
            </p>
          </div>

          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organization.org"
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-charcoal">
                  Password
                </label>
                <Link href="/forgot-password" prefetch={true} className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="w-full py-3.5 text-base rounded-xl mt-4"
            >
              Sign In
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-text-muted relative z-10">
            New here?{' '}
            <Link href="/register" prefetch={true} className="font-semibold text-primary hover:text-primary-hover underline decoration-primary/30 underline-offset-4 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
      
      <div className="hidden md:flex flex-1 relative items-center justify-center bg-primary-soft/30 p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sage-100/50 to-primary-100/50"></div>
        <div className="relative z-10 w-full max-w-lg bg-white/60 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/60 shadow-xl">
           <h2 className="font-heading text-h3 font-bold text-charcoal mb-4">Connecting communities to compassionate care</h2>
           <p className="text-text-secondary text-base leading-relaxed mix-blend-multiply">Join thousands of students, verified therapists, and NGOs working together to build accessible emotional support for everyone.</p>
           
           <div className="mt-8 flex items-center justify-between gap-6 rounded-2xl border border-white/70 bg-white/70 px-5 py-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[
                    { label: 'ST', className: 'bg-primary text-white' },
                    { label: 'TH', className: 'bg-sky-500 text-white' },
                    { label: 'NG', className: 'bg-amber-400 text-charcoal' },
                  ].map((member) => (
                    <div
                      key={member.label}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold shadow-sm ${member.className}`}
                    >
                      {member.label}
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-semibold text-charcoal">Trusted by 10k+ members</p>
                  <p className="text-xs text-slate-500">Students, therapists, and care partners</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Verified network
              </div>
           </div>

           <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Secure sign-in for therapy, community, and admin access
           </div>
        </div>
      </div>
    </div>
  );
}
