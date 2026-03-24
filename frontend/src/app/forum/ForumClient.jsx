'use client';

import { useState } from 'react';
import { useForum } from '@/hooks/useForum';
import { PostForm } from '@/components/forum/PostForm';
import { PostCard } from '@/components/forum/PostCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIES = [
  { value: 'all', label: 'All Posts' },
  { value: 'general', label: 'General' },
  { value: 'anxiety', label: 'Anxiety' },
  { value: 'depression', label: 'Depression' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'stress', label: 'Stress' },
  { value: 'success', label: 'Success Stories' },
];

export default function ForumContent() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const {
    posts,
    createPost,
    likePost,
    deletePost,
    addComment,
    deleteComment,
    likeComment,
  } = useForum({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  });

  const postList = posts.data?.data?.posts || posts.data?.posts || [];

  const handleLike = async (postId) => {
    try {
      const currentPost = postList.find((post) => post._id === postId);
      const hasLiked = Array.isArray(currentPost?.likedBy)
        ? currentPost.likedBy.some((id) => String(id) === String(user?._id))
        : !!currentPost?.likedByCurrentUser;

      await likePost.mutateAsync({ postId, liked: hasLiked, userId: user?._id });
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleDelete = async (postId) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost.mutateAsync(postId);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleAddComment = async ({ postId, ...commentData }) => {
    try {
      await addComment.mutateAsync({ postId, data: commentData });
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  const handleCommentLike = async (postId, commentId, hasLiked) => {
    try {
      await likeComment.mutateAsync({
        postId,
        commentId,
        liked: hasLiked,
        userId: user?._id,
      });
    } catch (err) {
      console.error('Comment like failed:', err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await deleteComment.mutateAsync({ postId, commentId });
    } catch (err) {
      console.error('Comment delete failed:', err);
    }
  };

  const handleCreatePost = async (payload) => {
    try {
      await createPost.mutateAsync(payload);
      setShowForm(false);
    } catch (err) {
      console.error('Create post failed:', err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-background text-charcoal pb-24">
      {/* Hero */}
      <section className="bg-surface border-b border-border/50 pb-16 pt-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary shadow-sm border border-primary/20 mb-6">
            <span className="text-base" aria-hidden="true">💬</span>
            <span>Community Forum</span>
          </div>
          <h1 className="font-heading text-h2 font-bold leading-tight text-charcoal sm:text-h1">
            Share experiences and support <span className="text-primary">one another</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl">
            A safe, moderated space to connect with peers, ask questions, and share your journey in a supportive environment.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="w-full sm:w-64">
              <Dropdown
                options={CATEGORIES}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white"
              />
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 w-full sm:w-auto justify-center shadow-soft"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              New Post
            </Button>
          </div>

          <Modal 
            open={showForm} 
            onClose={() => setShowForm(false)} 
            title="Create a New Post"
            description="Share your thoughts with the community."
          >
            <div className="-mx-6 -my-6 sm:mx-0 sm:my-0">
              <PostForm onCreate={handleCreatePost} />
            </div>
          </Modal>

          {/* Posts List */}
          <div className="space-y-6">
            {posts.isLoading ? (
              <div className="py-16 flex justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : posts.error ? (
              <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-200">
                <ErrorMessage message={String(posts.error)} />
              </div>
            ) : postList.length === 0 ? (
              <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-border/60">
                <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📝</div>
                <p className="font-semibold text-charcoal text-lg">No posts in this category yet</p>
                <p className="text-text-muted mt-2 mb-6">Be the first to share your thoughts and start a conversation.</p>
                <Button onClick={() => setShowForm(true)}>Create First Post</Button>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-500 slides-in-from-bottom-4">
                {postList.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={user?._id}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onComment={handleAddComment}
                    onCommentLike={handleCommentLike}
                    onDeleteComment={handleDeleteComment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
