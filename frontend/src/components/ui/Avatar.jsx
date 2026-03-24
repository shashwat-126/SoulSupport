"use client";

import { cn } from '@/lib/utils';
import { SeededImage } from '@/components/ui/SeededImage';

export function Avatar({ src, name = '', className, size = 40 }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-primary-soft text-primary ring-2 ring-surface shadow-sm transition-transform hover:scale-105',
        className
      )}
      style={{ width: size, height: size }}
    >
      <SeededImage
        src={src}
        seed={name || 'user-avatar'}
        category="avatar"
        alt={name || 'avatar'}
        width={size}
        height={size}
        loading="lazy"
        sizes={`${size}px`}
        className="object-cover h-full w-full"
      />
    </div>
  );
}
