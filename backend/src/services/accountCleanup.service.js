const mongoose = require('mongoose');
const ForumPost = require('../models/ForumPost.model');
const Notification = require('../models/Notification.model');
const Review = require('../models/Review.model');
const Session = require('../models/Session.model');
const SlotHold = require('../models/SlotHold.model');
const TherapistProfile = require('../models/TherapistProfile.model');
const User = require('../models/User.model');

function isTransactionUnsupportedError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('transaction numbers are only allowed') ||
    message.includes('replica set') ||
    message.includes('transaction is not supported')
  );
}

async function performAccountCleanup(userId, { deleteUser = true, session = null } = {}) {
  const sessionSelector = { $or: [{ userId }, { therapistId: userId }] };
  const opts = session ? { session } : {};

  await Promise.all([
    Review.deleteMany({ $or: [{ userId }, { therapistId: userId }] }, opts),
    Session.deleteMany(sessionSelector, opts),
    SlotHold.deleteMany(sessionSelector, opts),
    TherapistProfile.deleteMany({ userId }, opts),
    Notification.deleteMany({ userId }, opts),
    ForumPost.deleteMany({ userId }, opts),
    ForumPost.updateMany(
      {},
      { $pull: { likedBy: userId, comments: { userId } } },
      opts
    ),
    deleteUser ? User.deleteOne({ _id: userId }, opts) : Promise.resolve(),
  ]);

  // Recalculate comment counts with plain updates for broader Mongo compatibility.
  const posts = await ForumPost.find(
    { comments: { $exists: true } },
    { _id: 1, comments: 1 },
    opts
  ).lean();

  if (posts.length > 0) {
    const recountOps = posts.map((post) => ({
      updateOne: {
        filter: { _id: post._id },
        update: { $set: { commentsCount: Array.isArray(post.comments) ? post.comments.length : 0 } },
      },
    }));

    await ForumPost.bulkWrite(recountOps, opts);
  }
}

/**
 * Cascade-delete all data belonging to a user.
 * Wrapped in a MongoDB transaction so a mid-flight failure leaves no orphaned records.
 */
async function deleteUserAccountData(userId, { deleteUser = true } = {}) {
  const dbSession = await mongoose.startSession();

  try {
    dbSession.startTransaction();
    await performAccountCleanup(userId, { deleteUser, session: dbSession });
    await dbSession.commitTransaction();
  } catch (error) {
    if (dbSession.inTransaction()) {
      await dbSession.abortTransaction();
    }

    if (!isTransactionUnsupportedError(error)) {
      throw error;
    }

    await performAccountCleanup(userId, { deleteUser });
  } finally {
    dbSession.endSession();
  }
}

module.exports = { deleteUserAccountData };
