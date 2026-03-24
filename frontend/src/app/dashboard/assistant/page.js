"use client";

import { SoulBot } from '@/components/chat/SoulBot';

export default function DashboardAssistantPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-h3 sm:text-h2 font-bold text-charcoal">SoulBot</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your compassionate mental wellness companion - here to listen, support, and guide you.
        </p>
      </div>
      <SoulBot />
    </div>
  );
}
