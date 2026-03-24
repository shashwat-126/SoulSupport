'use client';

import { Button } from './Button';
import { cn } from '@/lib/utils';

/**
 * Generic pagination bar.
 * Props:
 *   page        – current 1-based page
 *   totalPages  – total number of pages
 *   onPageChange(newPage) – callback
 *   className   – extra classes for the wrapper
 */
export function Pagination({ page, totalPages, onPageChange, className }) {
  if (!totalPages || totalPages <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  // Show at most 5 page buttons centred around current page
  const delta = 2;
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={isFirst}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        ← Prev
      </Button>

      {start > 1 && (
        <>
          <PageBtn page={1} current={page} onPageChange={onPageChange} />
          {start > 2 && <span className="px-1 text-text-muted">…</span>}
        </>
      )}

      {pages.map((p) => (
        <PageBtn key={p} page={p} current={page} onPageChange={onPageChange} />
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-text-muted">…</span>}
          <PageBtn page={totalPages} current={page} onPageChange={onPageChange} />
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={isLast}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        Next →
      </Button>
    </nav>
  );
}

function PageBtn({ page, current, onPageChange }) {
  const isActive = page === current;
  return (
    <button
      onClick={() => onPageChange(page)}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'min-w-[2rem] rounded-lg px-2 py-1 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-white shadow-soft'
          : 'text-text-secondary hover:bg-surface-alt',
      )}
    >
      {page}
    </button>
  );
}
