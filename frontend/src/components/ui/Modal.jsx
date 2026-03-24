"use client";

import { useEffect, useRef } from 'react';
import { Button } from './Button';

export function Modal({ open, title, description, onClose, children, actions }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  if (!open) return null;

  return (
    <div 
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 backdrop-blur-sm p-4 sm:p-6 transition-opacity"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-card animate-in fade-in zoom-in-95 duration-200">
        <div className="flex shrink-0 items-start justify-between border-b border-border/50 px-6 py-5">
          <div className="flex flex-col gap-1">
            <h2 id="modal-title" className="font-heading text-xl font-bold text-charcoal">{title}</h2>
            {description && (
              <p id="modal-description" className="text-sm text-text-muted">{description}</p>
            )}
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close dialog"
            className="rounded-full p-2 text-text-muted hover:bg-surface-alt hover:text-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6 text-base text-text-secondary leading-relaxed">
          {children}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border/50 bg-surface-alt/30 px-6 py-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
