// src/routes/v1/notificationRoutes.js
import express from 'express';
import authenticate from '~/middlewares/authenticate.js';
import * as notificationController from '~/controllers/notificationController.js';

const router = express.Router();

// Protected routes (students only)
router.use(authenticate());

router.get('/', notificationController.getNotifications);
router.put('/:notificationId/read', notificationController.markNotificationAsRead);
router.get('/settings', notificationController.getNotificationSettings);
router.put('/settings', notificationController.updateNotificationSettings);
router.get('/upcoming-classes', notificationController.getUpcomingClasses);

export default router;