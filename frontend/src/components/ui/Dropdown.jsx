"use client";

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Dropdown = forwardRef(({ label, error, helperText, options = [], className, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-charcoal" htmlFor={props.id}>
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
          }
          className={cn(
            "h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 py-2 pr-10 text-sm text-charcoal shadow-sm transition-colors outline-none",
            "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-text-muted disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500/50 focus-visible:border-red-500",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p id={`${props.id}-error`} className="text-sm text-red-600 font-medium" aria-live="polite">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${props.id}-helper`} className="text-sm text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
});
Dropdown.displayName = "Dropdown";
