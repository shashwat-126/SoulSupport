import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { Heart } from 'lucide-react';

export function CommentList({ comments = [], onDelete, onLike, currentUserId }) {
  if (!comments.length) return <p className="text-sm text-slate-500">No comments yet.</p>;

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const canDelete = onDelete && currentUserId && String(comment.userId) === String(currentUserId);
        const hasLiked = Array.isArray(comment.likedBy)
          ? comment.likedBy.some((id) => String(id) === String(currentUserId))
          : !!comment.likedByCurrentUser;

        return (
          <div key={comment._id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={comment.author?.name || 'Anon'} src={comment.author?.avatarUrl} size={36} />
                <div>
                  <p className="text-sm font-semibold text-charcoal">{comment.author?.name || 'Anonymous'}</p>
                  <p className="text-xs text-slate-500">{formatDate(comment.createdAt)}</p>
                </div>
              </div>
              {canDelete && (
                <Button size="sm" variant="ghost" onClick={() => onDelete(comment._id)}>
                  Delete
                </Button>
              )}
            </div>
            <p className="mt-2 text-slate-700">{comment.content}</p>
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className={hasLiked ? 'text-red-500' : ''}
                onClick={() => onLike?.(comment._id, hasLiked)}
              >
                <Heart className="mr-2 h-4 w-4" fill={hasLiked ? 'currentColor' : 'none'} />
                {comment.likesCount || 0}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
