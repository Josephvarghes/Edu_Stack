// src/routes/v1/tutorRoutes.js
import express from 'express';
import authenticate from '~/middlewares/authenticate.js';
import * as tutorController from '~/controllers/tutorController.js';

const router = express.Router();

// Only tutors can access these routes
router.use(authenticate('tutor:read')); // or check role in controller

router.get('/dashboard', tutorController.getTutorDashboardData);
router.get('/earnings', tutorController.getEarningsData);

export default router;