// src/routes/v1/tutorRoutes.js
import express from 'express';
import authenticate from '~/middlewares/authenticate.js';
import * as tutorController from '~/controllers/tutorController.js';

const router = express.Router();

// Only tutors can access these routes
router.use(authenticate('tutor:read')); // or check role in controller

// Student tracking
router.get('/student-tracking', tutorController.getStudentTrackingData);
router.post('/send-bulk-message', tutorController.sendBulkMessage);
router.get('/export-student-data', tutorController.exportStudentData);

router.get('/dashboard', tutorController.getTutorDashboardData);
router.get('/earnings', tutorController.getEarningsData); 


export default router;