"use client";

import { useParams } from 'next/navigation';
import { useForumPost, useForum } from '@/hooks/useForum';
import { useAuth } from '@/hooks/useAuth';
import { CommentList } from '@/components/forum/CommentList';
import { CommentForm } from '@/components/forum/CommentForm';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { PostCard } from '@/components/forum/PostCard';

export default function ForumPostPage() {
  const params = useParams();
  const postId = params?.id;
  const { user } = useAuth();
  const { data, isLoading, error } = useForumPost(postId);
  const { addComment, deleteComment, likePost, likeComment } = useForum();

  const post = data?.data?.post || data?.post;

  const handlePostLike = async (targetPostId) => {
    const hasLiked = Array.isArray(post?.likedBy)
      ? post.likedBy.some((id) => String(id) === String(user?._id))
      : !!post?.likedByCurrentUser;

    await likePost.mutateAsync({
      postId: targetPostId,
      liked: hasLiked,
      userId: user?._id,
    });
  };

  const handleCommentLike = async (commentId, hasLiked) => {
    await likeComment.mutateAsync({
      postId,
      commentId,
      liked: hasLiked,
      userId: user?._id,
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      {isLoading && <LoadingSpinner label="Loading post..." />}
      {error && <ErrorMessage message={String(error)} />}
      {post && (
        <PostCard
          post={post}
          showActions={false}
          currentUserId={user?._id}
          onLike={handlePostLike}
        />
      )}
      {post && (
        <CommentList
          comments={post.comments || []}
          currentUserId={user?._id}
          onDelete={(commentId) => deleteComment.mutateAsync({ postId, commentId })}
          onLike={handleCommentLike}
        />
      )}
      {post && <CommentForm onSubmit={(payload) => addComment.mutateAsync({ postId, data: payload })} />}
    </div>
  );
}
