const ForumPost = require('../models/ForumPost.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { categories } = require('../validators/forum.validator');
const { getPaginationMetadata } = require('../utils/helpers');

/**
 * @desc    Get all forum posts
 * @route   GET /api/forum/posts
 * @access  Public
 */
exports.getPosts = asyncHandler(async (req, res) => {
  const { category, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const filter = {};
  if (category && category !== 'all') {
    filter.category = category;
  }

  const skip = (page - 1) * limit;

  const posts = await ForumPost.find(filter)
    .sort(sort)
    .limit(Number.parseInt(limit, 10))
    .skip(skip);

  const total = await ForumPost.countDocuments(filter);

  res.json(
    new ApiResponse(
      200,
      {
        posts,
        pagination: getPaginationMetadata(page, limit, total),
      },
      'Posts retrieved successfully'
    )
  );
});

/**
 * @desc    Create a new post
 * @route   POST /api/forum/posts
 * @access  Private
 */
exports.createPost = asyncHandler(async (req, res) => {
  const { content, category, isAnonymous } = req.body;

  const user = await User.findById(req.user.id);

  const anonymous = isAnonymous ?? true;

  const post = await ForumPost.create({
    userId: req.user.id,
    author: {
      name: anonymous ? 'Anonymous' : user.fullName,
      avatarUrl: anonymous ? null : user.avatarUrl,
    },
    content,
    category,
    isAnonymous: anonymous,
  });

  res
    .status(201)
    .json(new ApiResponse(201, { post }, 'Post created successfully'));
});

/**
 * @desc    Get single post
 * @route   GET /api/forum/posts/:id
 * @access  Public
 */
exports.getPost = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  res.json(new ApiResponse(200, { post }, 'Post retrieved successfully'));
});

/**
 * @desc    Like a post
 * @route   POST /api/forum/posts/:id/like
 * @access  Private
 */
exports.likePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = await ForumPost.findById(postId);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  if (post.likedBy.includes(userId)) {
    throw new ApiError(400, 'Post already liked');
  }

  post.likedBy.push(userId);
  post.likesCount += 1;
  await post.save();

  res.json(new ApiResponse(200, { post }, 'Post liked successfully'));
});

/**
 * @desc    Update own post
 * @route   PUT /api/forum/posts/:id
 * @access  Private
 */
exports.updatePost = asyncHandler(async (req, res) => {
  const { content, category, isAnonymous } = req.body;
  const post = await ForumPost.findById(req.params.id);

  if (!post) throw new ApiError(404, 'Post not found');
  if (post.userId.toString() !== req.user.id.toString()) {
    throw new ApiError(403, 'Not authorized to update this post');
  }

  const anonymous = isAnonymous ?? post.isAnonymous;

  post.content = content ?? post.content;
  post.category = category ?? post.category;
  post.isAnonymous = anonymous;
  post.author.name = anonymous ? 'Anonymous' : post.author.name;
  if (!anonymous) {
    const user = await User.findById(req.user.id);
    post.author.name = user.fullName;
    post.author.avatarUrl = user.avatarUrl;
  } else {
    post.author.avatarUrl = null;
  }

  await post.save();

  res.json(new ApiResponse(200, { post }, 'Post updated successfully'));
});

/**
 * @desc    Unlike a post
 * @route   DELETE /api/forum/posts/:id/like
 * @access  Private
 */
exports.unlikePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = await ForumPost.findById(postId);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  if (!post.likedBy.includes(userId)) {
    throw new ApiError(400, 'Post not liked yet');
  }

  post.likedBy = post.likedBy.filter(
    (id) => id.toString() !== userId.toString()
  );
  post.likesCount = Math.max(0, post.likesCount - 1);
  await post.save();

  res.json(new ApiResponse(200, { post }, 'Post unliked successfully'));
});

/**
 * @desc    Add comment to post
 * @route   POST /api/forum/posts/:id/comments
 * @access  Private
 */
exports.addComment = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const { content, isAnonymous } = req.body;

  const post = await ForumPost.findById(postId);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  const user = await User.findById(req.user.id);

  const anonymous = isAnonymous ?? true;

  const comment = {
    userId: req.user.id,
    author: {
      name: anonymous ? 'Anonymous' : user.fullName,
      avatarUrl: anonymous ? null : user.avatarUrl,
    },
    content,
    isAnonymous: anonymous,
    createdAt: new Date(),
  };

  post.comments.push(comment);
  await post.save();

  // Return the saved subdocument so callers have the generated _id
  const savedComment = post.comments[post.comments.length - 1];

  res
    .status(201)
    .json(new ApiResponse(201, { comment: savedComment }, 'Comment added successfully'));
});

/**
 * @desc    Delete own comment
 * @route   DELETE /api/forum/posts/:postId/comments/:commentId
 * @access  Private
 */
exports.deleteComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const post = await ForumPost.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');

  const comment = post.comments.id(commentId);
  if (!comment) throw new ApiError(404, 'Comment not found');

  if (comment.userId.toString() !== req.user.id.toString()) {
    throw new ApiError(403, 'Not authorized to delete this comment');
  }

  comment.deleteOne();
  await post.save();

  res.json(new ApiResponse(200, null, 'Comment deleted successfully'));
});

/**
 * @desc    Like a comment
 * @route   POST /api/forum/posts/:postId/comments/:commentId/like
 * @access  Private
 */
exports.likeComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user.id.toString();

  const post = await ForumPost.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');

  const comment = post.comments.id(commentId);
  if (!comment) throw new ApiError(404, 'Comment not found');

  const alreadyLiked = comment.likedBy.some(
    (id) => id.toString() === userId
  );
  if (alreadyLiked) {
    throw new ApiError(400, 'Comment already liked');
  }

  comment.likedBy.push(req.user.id);
  comment.likesCount = (comment.likesCount || 0) + 1;
  await post.save();

  res.json(new ApiResponse(200, { comment }, 'Comment liked successfully'));
});

/**
 * @desc    Unlike a comment
 * @route   DELETE /api/forum/posts/:postId/comments/:commentId/like
 * @access  Private
 */
exports.unlikeComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user.id.toString();

  const post = await ForumPost.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');

  const comment = post.comments.id(commentId);
  if (!comment) throw new ApiError(404, 'Comment not found');

  const alreadyLiked = comment.likedBy.some(
    (id) => id.toString() === userId
  );
  if (!alreadyLiked) {
    throw new ApiError(400, 'Comment not liked yet');
  }

  comment.likedBy = comment.likedBy.filter((id) => id.toString() !== userId);
  comment.likesCount = Math.max(0, (comment.likesCount || 0) - 1);
  await post.save();

  res.json(new ApiResponse(200, { comment }, 'Comment unliked successfully'));
});

/**
 * @desc    Delete own post
 * @route   DELETE /api/forum/posts/:id
 * @access  Private
 */
exports.deletePost = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  if (post.userId.toString() !== req.user.id.toString()) {
    throw new ApiError(403, 'Not authorized to delete this post');
  }

  await post.deleteOne();

  res.json(new ApiResponse(200, null, 'Post deleted successfully'));
});

/**
 * @desc    Get available categories
 * @route   GET /api/forum/categories
 * @access  Public
 */
exports.getCategories = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, { categories }, 'Categories retrieved successfully'));
});
