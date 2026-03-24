'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    userType: 'user',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      toast.success('Registration successful!');
    } catch (error) {
      toast.error(error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-background py-12 px-4 sm:px-6">
      <div className="w-full max-w-lg">
        <Card className="shadow-card border-border/50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-h3 sm:text-h2 text-charcoal">
              Get started - it&apos;s free
            </CardTitle>
            <CardDescription className="text-base text-text-muted mt-2">
              Join our community for accessible mental health support.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                label="Full Name"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full name (first + last)"
              />

              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@organization.org"
              />

              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
              />

              <div className="space-y-1.5">
                <label htmlFor="userType" className="block text-sm font-semibold text-charcoal">
                  I want to...
                </label>
                <div className="relative">
                  <select
                    id="userType"
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-base border-border bg-surface border rounded-xl text-charcoal focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none appearance-none"
                  >
                    <option value="user">Join as a User (Seek support)</option>
                    <option value="therapist">Join as a Therapist (Provide support)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-charcoal">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {formData.userType === 'therapist' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label htmlFor="bio" className="block text-sm font-semibold text-charcoal">
                    Professional Bio <span className="text-text-muted font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-base border border-border rounded-xl bg-surface text-charcoal focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none"
                    placeholder="Briefly describe your expertise and focus areas..."
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className="w-full py-3.5 text-base rounded-xl mt-6"
              >
                Create Account
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-text-muted">
              Already have an account?{' '}
              <Link href="/login" prefetch={true} className="font-semibold text-primary hover:text-primary-hover underline decoration-primary/30 underline-offset-4 transition-colors">
                Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
