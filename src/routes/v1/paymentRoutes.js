// src/routes/v1/paymentRoutes.js
import express from 'express';
import authenticate from '~/middlewares/authenticate.js';
import * as paymentController from '~/controllers/paymentController.js';

const router = express.Router();

// Public routes
router.get('/plans', paymentController.getPlans);

// Protected routes
router.use(authenticate());

router.post('/promo-codes/apply', paymentController.applyPromoCode);
router.post('/orders', paymentController.createOrder);
router.post('/orders/:orderId/verify', paymentController.verifyPayment);
router.get('/orders/:orderId', paymentController.getOrderById);

export default router;