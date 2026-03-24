const Notification = require('../models/Notification.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(Number.parseInt(limit, 10))
    .skip(skip);

  const total = await Notification.countDocuments({ userId: req.user.id });
  const unreadCount = await Notification.countDocuments({
    userId: req.user.id,
    isRead: false,
  });

  res.json(
    new ApiResponse(
      200,
      {
        notifications,
        unreadCount,
        pagination: {
          page: Number.parseInt(page, 10),
          limit: Number.parseInt(limit, 10),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      'Notifications retrieved successfully'
    )
  );
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (notification.userId.toString() !== req.user.id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }

  notification.isRead = true;
  await notification.save();

  res.json(
    new ApiResponse(
      200,
      { notification },
      'Notification marked as read'
    )
  );
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (notification.userId.toString() !== req.user.id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }

  await notification.deleteOne();

  res.json(
    new ApiResponse(200, null, 'Notification deleted successfully')
  );
});
