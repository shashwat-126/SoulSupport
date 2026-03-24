"use client";

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function RichTextEditor({ value = '', onChange, placeholder, className }) {
  const ref = useRef(null);
  const lastValueRef = useRef('');

  // Initialize/sync only when the external value truly changes.
  // Avoid rewriting on every keystroke (that resets caret to start and makes typing appear reversed).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const next = String(value ?? '');
    if (next === lastValueRef.current) return;

    // If user is actively typing in the editor, don't clobber caret.
    const isActive = typeof document !== 'undefined' && document.activeElement === el;
    if (isActive) return;

    el.innerText = next;
    lastValueRef.current = next;
  }, [value]);

  const handleInput = (e) => {
    const next = e.currentTarget.innerText;
    lastValueRef.current = next;
    onChange?.(next);
  };

  return (
    <div
      ref={ref}
      className={cn(
        'min-h-[140px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-charcoal shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200',
        className
      )}
      contentEditable
      dir="ltr"
      lang="en"
      spellCheck
      style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
      suppressContentEditableWarning
      onInput={handleInput}
      data-placeholder={placeholder}
    />
  );
}
