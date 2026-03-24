"use client";

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  variants: {
    variant: {
      primary: 'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary shadow-soft hover:shadow-card active:scale-95 transition-all duration-300',
      secondary: 'bg-surface-alt text-charcoal hover:bg-gray-200 focus-visible:ring-gray-400 shadow-sm active:scale-95 transition-all duration-300',
      outline: 'border-2 border-primary/20 text-primary hover:border-primary/50 hover:bg-primary-soft/30 focus-visible:ring-primary active:scale-95 transition-all duration-300',
      ghost: 'text-charcoal hover:bg-gray-100/80 active:scale-95 transition-all duration-300',
      danger: 'bg-coral text-white hover:bg-coral-600 focus-visible:ring-coral shadow-soft hover:shadow-card active:scale-95 transition-all duration-300',
    },
    size: {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-8 py-3.5 text-lg',
    },
  },
  defaults: {
    variant: 'primary',
    size: 'md',
  },
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className, children, disabled, isLoading, ...props },
  ref
) {
  const variantClass = buttonVariants.variants.variant[variant];
  const sizeClass = buttonVariants.variants.size[size];

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300',
        variantClass,
        sizeClass,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
});
