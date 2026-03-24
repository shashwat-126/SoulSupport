const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['guide', 'video', 'podcast', 'article'],
      required: true,
    },
    category: {
      type: String,
      enum: ['anxiety', 'depression', 'stress', 'relationships', 'general'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    author: {
      type: String,
    },
    duration: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
  },
  {
    timestamps: true,
  }
);

// Indexes
resourceSchema.index({ type: 1, category: 1 });
resourceSchema.index({ isPublished: 1, createdAt: -1 });
resourceSchema.index({ tags: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
