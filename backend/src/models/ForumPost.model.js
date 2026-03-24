const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  author: {
    name: String,
    avatarUrl: String,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  isAnonymous: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likesCount: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

const forumPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    author: {
      name: String,
      avatarUrl: String,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'general',
        'anxiety',
        'depression',
        'relationships',
        'stress',
        'success',
      ],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      maxlength: 5000,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
forumPostSchema.index({ category: 1, createdAt: -1 });
forumPostSchema.index({ userId: 1 });
forumPostSchema.index({ likesCount: -1 });

// Update comments count before save
forumPostSchema.pre('save', function () {
  if (this.isModified('comments')) {
    this.commentsCount = this.comments.length;
  }
});

module.exports = mongoose.model('ForumPost', forumPostSchema);
