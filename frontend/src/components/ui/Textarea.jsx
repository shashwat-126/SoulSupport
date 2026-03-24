"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Textarea = forwardRef(
  ({ className, error, label, helperText, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-semibold text-charcoal">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
          }
          className={cn(
            "flex min-h-[120px] w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-charcoal placeholder:text-text-muted",
            "transition-colors shadow-sm outline-none",
            "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-text-muted disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500/50 focus-visible:border-red-500",
            className
          )}
          {...props}
        />
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
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
