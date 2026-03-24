"use client";

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(function Input({ className, id, label, error, helperText, type = 'text', required, ...props }, ref) {
  // If used without label/error props, works exactly as before.
  if (!label && !error && !helperText) {
    return (
      <input
        id={id}
        ref={ref}
        type={type}
        required={required}
        className={cn(
          'w-full px-4 py-3 text-base border rounded-xl bg-surface transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 border-border text-charcoal focus-visible:border-primary focus-visible:ring-primary/20 placeholder:text-text-muted/60',
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-semibold text-charcoal"
        >
          {label} {required && <span className="text-coral" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={type}
          aria-invalid={!!error}
          aria-describedby={
            cn(error ? `${id}-error` : null, helperText ? `${id}-description` : null) || undefined
          }
          className={cn(
            'w-full px-4 py-3 text-base border rounded-xl bg-surface transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            error 
              ? 'border-coral text-coral focus-visible:border-coral focus-visible:ring-coral/20' 
              : 'border-border text-charcoal focus-visible:border-primary focus-visible:ring-primary/20 placeholder:text-text-muted/60',
            className
          )}
          required={required}
          {...props}
        />
      </div>
      
      {/* Error / Helper Message (aria-live region) */}
      <div 
        aria-live="polite" 
        className={cn("min-h-[20px]", !error && !helperText && "hidden")}
      >
        {error && (
          <p id={`${id}-error`} className="text-sm text-coral font-medium mt-1 animate-fade-in">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${id}-description`} className="text-sm text-text-muted mt-1">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
});
