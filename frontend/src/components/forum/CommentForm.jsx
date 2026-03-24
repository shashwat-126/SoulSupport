"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export function CommentForm({ onSubmit }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ content, isAnonymous: false });
      setContent('');
      toast.success('Comment added');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err) || 'Unable to add comment';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <textarea
        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-charcoal shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        rows={3}
        placeholder="Add your perspective"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Post comment'}
        </Button>
      </div>
    </form>
  );
}
