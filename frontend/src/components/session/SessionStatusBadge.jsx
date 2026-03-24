import { Badge } from '@/components/ui/Badge';

const toneMap = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled_by_user: 'danger',
  cancelled_by_therapist: 'danger',
  expired: 'neutral',
};

const labelMap = {
  pending: 'Pending confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled_by_user: 'Cancelled by User',
  cancelled_by_therapist: 'Cancelled by Therapist',
  expired: 'Expired',
};

export function SessionStatusBadge({ status }) {
  return (
    <Badge tone={toneMap[status] || 'neutral'}>
      {labelMap[status] || status}
    </Badge>
  );
}
