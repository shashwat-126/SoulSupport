const mongoose = require('mongoose');

const therapistProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specializations: {
      type: [String],
      default: [],
      enum: [
        'anxiety',
        'depression',
        'relationships',
        'stress',
        'trauma',
        'addiction',
        'grief',
        'self-esteem',
        'career',
        'family',
      ],
    },
    qualifications: {
      type: String,
      required: [true, 'Qualifications are required'],
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: 0,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    professionalPhotoUrl: {
      type: String,
      default: null,
    },
    availability: {
      days: {
        type: [String],
        enum: [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ],
        default: [],
      },
      timeStart: {
        type: String,
        default: '09:00',
      },
      timeEnd: {
        type: String,
        default: '17:00',
      },
    },
    weeklyAvailability: {
      monday: { type: [String], default: [] },
      tuesday: { type: [String], default: [] },
      wednesday: { type: [String], default: [] },
      thursday: { type: [String], default: [] },
      friday: { type: [String], default: [] },
      saturday: { type: [String], default: [] },
      sunday: { type: [String], default: [] },
    },
    languages: {
      type: [String],
      default: [],
    },
    sessionPricing: {
      type: Number,
      min: 0,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    recentReviews: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        userName: String,
        rating: Number,
        text: String,
        date: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
therapistProfileSchema.index({ isVerified: 1, rating: -1 });
therapistProfileSchema.index({ specializations: 1 });

// Virtual populate
therapistProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

module.exports = mongoose.model('TherapistProfile', therapistProfileSchema);
