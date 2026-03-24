"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { forumService } from '@/services/forumService';

const FALLBACK_CATEGORIES = [
  { label: 'General', value: 'general' },
  { label: 'Anxiety', value: 'anxiety' },
  { label: 'Relationships', value: 'relationships' },
  { label: 'Work', value: 'work' },
];

export function PostForm({ onCreate }) {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: () => forumService.getCategories(),
    staleTime: 5 * 60 * 1000,
  });
  const categories = Array.isArray(categoriesData?.data?.categories)
    ? categoriesData.data.categories.map((c) => ({
        label: c.charAt(0).toUpperCase() + c.slice(1),
        value: c,
      }))
    : FALLBACK_CATEGORIES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to post');
      return;
    }
    setLoading(true);
    try {
      await onCreate({ content, category, isAnonymous });
      setContent('');
      setIsAnonymous(true);
      toast.success('Posted to the community');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err) || 'Unable to post';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Share your thoughts or ask a question..."
        />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Dropdown label="Category" value={category} onChange={setCategory} options={categories} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Post anonymously
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Post to forum'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
