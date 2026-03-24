import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';

export function ReviewCard({ review }) {
  const reviewerName = review.reviewer?.name || review.reviewer?.fullName || 'User';
  const text = review.comment || review.reviewText || '';

  return (
    <Card className="space-y-2">
      <div className="flex items-center gap-3">
        <Avatar name={reviewerName} size={40} />
        <div>
          <p className="text-sm font-semibold text-charcoal">{reviewerName}</p>
          <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
        </div>
        <div className="ml-auto rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          {review.rating}/5
        </div>
      </div>
      {review.reviewTitle && <p className="text-sm font-semibold text-charcoal">{review.reviewTitle}</p>}
      <p className="text-sm text-slate-700">{text}</p>
    </Card>
  );
}
