// src/routes/v1/dashboardRoutes.js
import express from 'express';
import authenticate from '~/middlewares/authenticate.js';
import * as dashboardController from '~/controllers/dashboardController.js';

const router = express.Router();

// Protected routes (students only)
router.use(authenticate());

router.get('/', dashboardController.getDashboardData);
router.get('/progress-tracker', dashboardController.getProgressTrackerData);

export default router;