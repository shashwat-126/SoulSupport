const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    therapistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    therapist: {
      name: String,
      photoUrl: String,
      specializations: [String],
    },
    user: {
      name: String,
      email: String,
      avatarUrl: String,
    },
    sessionDate: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'cancelled_by_user',
        'cancelled_by_therapist',
        'completed',
        'expired',
      ],
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
    meetingLink: {
      type: String,
    },
    meetingRoomId: {
      type: String,
    },
    meetingStatus: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    meetingStartedAt: {
      type: Date,
      default: null,
    },
    meetingEndedAt: {
      type: Date,
      default: null,
    },
    sessionStatusUser: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    sessionStatusTherapist: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    cancellationReasonUser: {
      type: String,
      maxlength: 500,
    },
    cancellationReasonTherapist: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
sessionSchema.index({ therapistId: 1, sessionDate: 1 });
sessionSchema.index({ userId: 1, sessionDate: 1 });
sessionSchema.index({ status: 1, sessionDate: 1 });
sessionSchema.index({ sessionDate: 1 });

// Ensure no double booking
sessionSchema.index(
  { therapistId: 1, sessionDate: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed'] },
    },
  }
);

module.exports = mongoose.model('Session', sessionSchema);
