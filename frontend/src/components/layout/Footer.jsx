import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-sage flex items-center justify-center shadow-soft transform group-hover:scale-105 transition-transform">
                 <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                 </svg>
              </div>
              <span className="font-heading text-xl font-bold text-charcoal tracking-tight">Soul<span className="text-primary">Support</span></span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Accessible mental health support for students, therapists, and NGOs worldwide.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-charcoal mb-4">Platform</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-text-secondary hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/resources" className="text-sm text-text-secondary hover:text-primary transition-colors">Resource Library</Link></li>
              <li><Link href="/forum" className="text-sm text-text-secondary hover:text-primary transition-colors">Community Forum</Link></li>
            </ul>
          </div>

          {/* Legal / Policy */}
          <div>
            <h4 className="font-semibold text-charcoal mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-text-secondary hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-text-secondary hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-text-secondary hover:text-primary transition-colors">Accessibility</Link></li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h4 className="font-semibold text-charcoal mb-4">Ready to seek help?</h4>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              Join thousands of students and professionals.
            </p>
            <Link href="/register">
              <Button size="sm" className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} SoulSupport. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-xs text-text-muted">Not an emergency service.</span>
            <Link href="/resources" className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors">Crisis Resources</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
