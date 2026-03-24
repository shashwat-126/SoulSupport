import { Spinner } from '@/components/ui/Spinner';

export function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
