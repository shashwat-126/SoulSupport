const Notification = require('../models/Notification.model');

class NotificationService {
  async createNotification(
    userId,
    type,
    title,
    message,
    relatedEntityId,
    relatedEntityType
  ) {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedEntityId,
      relatedEntityType,
      isRead: false,
    });

    return notification;
  }

  async notifySessionBooked(therapistId, userId, sessionId, userName) {
    await this.createNotification(
      therapistId,
      'session_booked',
      'New Session Booking',
      `${userName} has booked a session with you`,
      sessionId,
      'session'
    );
  }

  async notifySessionConfirmed(userId, therapistId, sessionId, therapistName) {
    await this.createNotification(
      userId,
      'session_confirmed',
      'Session Confirmed',
      `Your session with ${therapistName} has been confirmed`,
      sessionId,
      'session'
    );
  }

  async notifySessionCancelled(userId, sessionId, reason) {
    await this.createNotification(
      userId,
      'session_cancelled',
      'Session Cancelled',
      `A session has been cancelled. ${reason || ''}`,
      sessionId,
      'session'
    );
  }

  async notifyNewReview(therapistId, userId, reviewId, rating) {
    await this.createNotification(
      therapistId,
      'new_review',
      'New Review',
      `You received a ${rating}-star review`,
      reviewId,
      'review'
    );
  }

  async getUnreadCount(userId) {
    return await Notification.countDocuments({
      userId,
      isRead: false,
    });
  }
}

module.exports = new NotificationService();
