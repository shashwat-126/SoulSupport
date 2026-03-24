const TherapistProfile = require('../models/TherapistProfile.model');
const Review = require('../models/Review.model');

class RatingService {
  /**
   * Recalculate and update therapist rating
   */
  async updateTherapistRating(therapistId) {
    const reviews = await Review.find({ therapistId });

    if (reviews.length === 0) {
      await TherapistProfile.findOneAndUpdate(
        { userId: therapistId },
        {
          rating: 0,
          totalReviews: 0,
          recentReviews: [],
        }
      );
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Get recent reviews (last 5)
    const recentReviews = reviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((review) => ({
        userId: review.userId,
        userName: review.reviewer.name,
        rating: review.rating,
        text: review.comment || review.reviewText,
        date: review.createdAt,
      }));

    // Update therapist profile
    await TherapistProfile.findOneAndUpdate(
      { userId: therapistId },
      {
        rating: Math.round(averageRating * 100) / 100,
        totalReviews: reviews.length,
        recentReviews,
      }
    );
  }

  /**
   * Increment therapist's total sessions count
   */
  async incrementSessionCount(therapistId) {
    await TherapistProfile.findOneAndUpdate(
      { userId: therapistId },
      { $inc: { totalSessions: 1 } }
    );
  }
}

module.exports = new RatingService();
