import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumService } from '@/services/forumService';

export function useForum(params, postsQueryOptions = {}) {
  const queryClient = useQueryClient();
  const postsQueryKey = ['forum-posts', params];

  const posts = useQuery({
    queryKey: postsQueryKey,
    queryFn: () => forumService.getPosts(params),
    ...postsQueryOptions,
  });
  const categories = useQuery({ queryKey: ['forum-categories'], queryFn: forumService.getCategories });

  const createPost = useMutation({
    mutationFn: forumService.createPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-posts'] }),
  });

  const deletePost = useMutation({
    mutationFn: forumService.deletePost,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post', variables] });
    },
  });

  const addComment = useMutation({
    mutationFn: ({ postId, data }) => forumService.addComment(postId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: ({ postId, commentId }) => forumService.deleteComment(postId, commentId),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['forum-post', variables.postId] }),
  });

  const likePost = useMutation({
    mutationFn: ({ postId, liked }) =>
      liked ? forumService.unlikePost(postId) : forumService.likePost(postId),
    onMutate: async ({ postId, userId }) => {
      await queryClient.cancelQueries({ queryKey: postsQueryKey });
      const previousPosts = queryClient.getQueryData(postsQueryKey);

      queryClient.setQueryData(postsQueryKey, (oldData) => {
        if (!oldData) {
          return oldData;
        }

        const root = oldData.data ? oldData : { data: oldData };
        const currentPosts = root.data?.posts || [];

        const nextPosts = currentPosts.map((post) => {
          if (post._id !== postId) {
            return post;
          }

          const likedBy = Array.isArray(post.likedBy) ? [...post.likedBy] : [];
          const hasLiked = likedBy.some((id) => String(id) === String(userId));

          if (hasLiked) {
            return {
              ...post,
              likedBy: likedBy.filter((id) => String(id) !== String(userId)),
              likesCount: Math.max(0, (post.likesCount || 0) - 1),
            };
          }

          return {
            ...post,
            likedBy: [...likedBy, userId],
            likesCount: (post.likesCount || 0) + 1,
          };
        });

        return oldData.data
          ? { ...oldData, data: { ...oldData.data, posts: nextPosts } }
          : { ...oldData, posts: nextPosts };
      });

      return { previousPosts };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postsQueryKey, context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });

  const likeComment = useMutation({
    mutationFn: ({ postId, commentId, liked }) =>
      liked
        ? forumService.unlikeComment(postId, commentId)
        : forumService.likeComment(postId, commentId),
    onMutate: async ({ postId, commentId, userId }) => {
      await queryClient.cancelQueries({ queryKey: postsQueryKey });
      await queryClient.cancelQueries({ queryKey: ['forum-post', postId] });
      const previousPosts = queryClient.getQueryData(postsQueryKey);
      const previousPost = queryClient.getQueryData(['forum-post', postId]);

      const toggleCommentLike = (comment) => {
        if (comment._id !== commentId) {
          return comment;
        }

        const likedBy = Array.isArray(comment.likedBy) ? [...comment.likedBy] : [];
        const hasLiked = likedBy.some((id) => String(id) === String(userId));

        if (hasLiked) {
          return {
            ...comment,
            likedBy: likedBy.filter((id) => String(id) !== String(userId)),
            likesCount: Math.max(0, (comment.likesCount || 0) - 1),
          };
        }

        return {
          ...comment,
          likedBy: [...likedBy, userId],
          likesCount: (comment.likesCount || 0) + 1,
        };
      };

      queryClient.setQueryData(postsQueryKey, (oldData) => {
        if (!oldData) {
          return oldData;
        }

        const root = oldData.data ? oldData : { data: oldData };
        const currentPosts = root.data?.posts || [];

        const nextPosts = currentPosts.map((post) => {
          if (post._id !== postId) {
            return post;
          }

          return {
            ...post,
            comments: (post.comments || []).map(toggleCommentLike),
          };
        });

        return oldData.data
          ? { ...oldData, data: { ...oldData.data, posts: nextPosts } }
          : { ...oldData, posts: nextPosts };
      });

      queryClient.setQueryData(['forum-post', postId], (oldData) => {
        if (!oldData) {
          return oldData;
        }

        const root = oldData.data ? oldData : { data: oldData };
        const post = root.data?.post;
        if (!post) {
          return oldData;
        }

        const updatedComments = (post.comments || []).map(toggleCommentLike);

        const updatedPost = { ...post, comments: updatedComments };
        return oldData.data
          ? { ...oldData, data: { ...oldData.data, post: updatedPost } }
          : { ...oldData, post: updatedPost };
      });

      return { previousPost, previousPosts };
    },
    onError: (_error, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postsQueryKey, context.previousPosts);
      }
      if (context?.previousPost && variables?.postId) {
        queryClient.setQueryData(['forum-post', variables.postId], context.previousPost);
      }
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.postId) {
        queryClient.invalidateQueries({ queryKey: ['forum-post', variables.postId] });
      }
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });

  return {
    posts,
    categories,
    createPost,
    deletePost,
    addComment,
    deleteComment,
    likePost,
    likeComment,
  };
}

export function useForumPost(postId) {
  return useQuery({ queryKey: ['forum-post', postId], queryFn: () => forumService.getPost(postId), enabled: !!postId });
}
