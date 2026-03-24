"use client";

import { SoulBot } from '@/components/chat/SoulBot';

export default function TherapistAssistantPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-h3 sm:text-h2 font-bold text-charcoal">SoulBot</h1>
        <p className="mt-1 text-sm text-text-secondary">
          AI-powered guidance for session management, client engagement, and professional development.
        </p>
      </div>
      <SoulBot />
    </div>
  );
}
