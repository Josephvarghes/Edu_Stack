// src/controllers/notificationController.js
import httpStatus from 'http-status';
import APIError from '~/utils/apiError.js';
import catchAsync from '~/utils/catchAsync.js';
import Notification from '~/models/notificationModel';
import Setting from '~/models/settingModel';

/**
 * Get notifications for user (with optional type filter)
 */
export const getNotifications = catchAsync(async (req, res) => {
  const { type } = req.query;
  const userId = req.user.id;

  let filter = { userId };
  if (type) {
    filter.type = type;
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  // Group by date (Today, Yesterday, Earlier)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const grouped = {
    today: [],
    yesterday: [],
    earlier: []
  };

  notifications.forEach(notification => {
    const notifDate = new Date(notification.createdAt);
    notifDate.setHours(0, 0, 0, 0);

    if (notifDate.getTime() === today.getTime()) {
      grouped.today.push(notification);
    } else if (notifDate.getTime() === yesterday.getTime()) {
      grouped.yesterday.push(notification);
    } else {
      grouped.earlier.push(notification);
    }
  });

  res.json({
    success: true,
    data:{grouped},
    message: 'Notifications retrieved successfully'
  });
});

/**
 * Mark notification as read
 */
export const markNotificationAsRead = catchAsync(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  const notification = await Notification.findOne({ _id: notificationId, userId });
  if (!notification) {
    throw new APIError('Notification not found', httpStatus.NOT_FOUND);
  }

  notification.isRead = true;
  await notification.save();

  res.json({
    success: true,
     data:{ isRead: true },
    message: 'Notification marked as read'
  });
});

/**
 * Get notification settings
 */
export const getNotificationSettings = catchAsync(async (req, res) => {
  const userId = req.user.id;

  let setting = await Setting.findOne({ userId }).lean();
  if (!setting) {
    // Create default settings
    setting = await Setting.create({ userId });
  }

  res.json({
    success: true,
    data: { notifications: setting.notifications },
    message: 'Notification settings retrieved successfully'
  });
});

/**
 * Update notification settings
 */
export const updateNotificationSettings = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { notifications } = req.body;

  let setting = await Setting.findOne({ userId });
  if (!setting) {
    setting = await Setting.create({ userId, notifications });
  } else {
    setting.notifications = { ...setting.notifications, ...notifications };
    await setting.save();
  }

  res.json({
    success: true,
    data: { notifications: setting.notifications },
    message: 'Notification settings updated successfully'
  });
});

/**
 * Get upcoming classes (mock data for MVP)
 */
export const getUpcomingClasses = catchAsync(async (req, res) => {
  // For MVP, return mock data
  const upcomingClasses = [
    {
      title: 'Cell Structures',
      startTime: '07:00',
      endTime: '09:30',
      action: 'join_class',
      status: 'live'
    },
    {
      title: 'Molecular Structure',
      startTime: '09:45',
      endTime: '11:40',
      action: 'join_class',
      status: 'live'
    },
    {
      title: 'Limits and Derivatives',
      startTime: '14:30',
      endTime: '15:30',
      action: 'join_class',
      status: 'upcoming',
      startsIn: '2h 15m'
    },
    {
      title: 'Algebra & Calculus Foundations',
      startTime: '15:30',
      endTime: '16:30',
      action: 'join_class',
      status: 'upcoming',
      startsIn: '3h 45m'
    },
    {
      title: 'Organic Chemistry Lab',
      startTime: '16:00',
      endTime: '18:00',
      action: 'join_class',
      status: 'upcoming',
      startsIn: '5h 15m'
    },
    {
      title: 'Cell Division & Genetics',
      startTime: '18:30',
      endTime: '20:00',
      action: 'join_class',
      status: 'upcoming',
      startsIn: '7h 45m'
    }
  ];

  res.json({
    success: true,
     data:{
      date: '2025-07-24',
      classes: upcomingClasses
    },
    message: 'Upcoming classes retrieved successfully'
  });
});