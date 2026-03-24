import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Toaster } from 'react-hot-toast';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { FooterGate } from '@/components/layout/FooterGate';
import { PrefetchRoutes } from '@/components/PrefetchRoutes';

const heading = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-heading' });
const sans = Outfit({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'SoulSupport - Online Therapy Platform',
  description: 'Professional online therapy and mental wellness support',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${heading.variable} ${sans.variable} bg-background text-charcoal transition-colors`}>
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <Providers>
          <AuthProvider>
            <NotificationProvider>
              <PrefetchRoutes />
              <Header />
              <main id="main-content" className="min-h-screen outline-none" tabIndex={-1}>
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
              <FooterGate />
              <Toaster 
                position="bottom-right" 
                toastOptions={{
                  style: {
                    background: 'var(--color-surface)',
                    color: 'var(--color-charcoal)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-card)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                  },
                  success: {
                    iconTheme: {
                      primary: 'var(--color-primary)',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </NotificationProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
