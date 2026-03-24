"use client";

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';

export function PostCard({
  post,
  onLike,
  onDelete,
  onComment,
  onCommentLike,
  onDeleteComment,
  currentUserId,
  showActions = true,
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const handleLike = async () => {
    try {
      await onLike?.(post._id);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const hasLiked = Array.isArray(post.likedBy)
    ? post.likedBy.some((id) => String(id) === String(currentUserId))
    : !!post.likedByCurrentUser;
  const canDeletePost = showActions && onDelete && currentUserId && String(post.userId) === String(currentUserId);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await onComment?.({ postId: post._id, content: commentText, isAnonymous });
      setCommentText('');
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow space-y-4">
      {/* Post Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <Avatar
            src={post.isAnonymous ? null : post.author?.avatarUrl}
            name={post.author?.name || 'Anonymous'}
            size={44}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading font-semibold text-charcoal">
                {post.isAnonymous ? 'Anonymous' : post.author?.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
              <span>•</span>
              <Badge tone="info" className="capitalize text-xs">
                {post.category || 'General'}
              </Badge>
            </div>
          </div>
        </div>
        {canDeletePost && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(post._id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Post Content */}
      <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
        {post.content}
      </div>

      {/* Post Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={hasLiked ? 'text-red-500' : ''}
        >
          <Heart
            className="w-4 h-4 mr-2"
            fill={hasLiked ? 'currentColor' : 'none'}
          />
          <span>{post.likesCount || 'Like'}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
          <MessageCircle className="w-4 h-4 mr-2" />
          <span>{post.comments?.length || 0} Comments</span>
        </Button>

        <Link href={`/forum/${post._id}`} className="ml-auto">
          <Button variant="ghost" size="sm" className="text-primary-600">
            View thread →
          </Button>
        </Link>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          {/* Comment Form */}
          {onComment && (
            <form onSubmit={handleAddComment} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a supportive comment..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button type="submit" size="sm" disabled={!commentText.trim()}>
                  Send
                </Button>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded"
                />
                Post anonymously
              </label>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {post.comments?.map((comment) => (
              <div key={comment._id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar
                  src={comment.isAnonymous ? null : comment.author?.avatarUrl}
                  name={comment.author?.name || 'Anonymous'}
                  size={32}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.isAnonymous ? 'Anonymous' : comment.author?.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(comment.createdAt))} ago
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{comment.content}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        Array.isArray(comment.likedBy) &&
                        comment.likedBy.some((id) => String(id) === String(currentUserId))
                          ? 'text-red-500'
                          : ''
                      }
                      onClick={() => {
                        const hasLiked = Array.isArray(comment.likedBy)
                          ? comment.likedBy.some((id) => String(id) === String(currentUserId))
                          : !!comment.likedByCurrentUser;
                        onCommentLike?.(post._id, comment._id, hasLiked);
                      }}
                    >
                      <Heart
                        className="w-4 h-4 mr-2"
                        fill={
                          Array.isArray(comment.likedBy) &&
                          comment.likedBy.some((id) => String(id) === String(currentUserId))
                            ? 'currentColor'
                            : 'none'
                        }
                      />
                      {comment.likesCount || 0}
                    </Button>
                    {onDeleteComment && String(comment.userId) === String(currentUserId) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteComment(post._id, comment._id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!post.comments?.length && (
              <p className="text-sm text-slate-500 text-center py-4">No comments yet. Be the first to respond!</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
