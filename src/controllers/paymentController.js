import httpStatus from 'http-status';
import APIError from '~/utils/apiError.js';
import catchAsync from '~/utils/catchAsync.js';
import Plan from '~/models/planModel';
import PromoCode from '~/models/PromoCodeModel';
import Order from '~/models/orderModel';
import config from '~/config/config'; 
import razorpay from "razorpay"; 
import Course from "~/models/courseModel";

// const razorpay = new Razorpay({
//   key_id: config.RAZORPAY_KEY_ID,
//   key_secret: config.RAZORPAY_KEY_SECRET
// });
/**
 * Get all plans (for subscription page)
 */
export const getPlans = catchAsync(async (req, res) => {
  const plans = await Plan.find().sort({ price: 1 }).lean();
  res.json({
    success: true,
     plans,
    message: 'Plans retrieved successfully'
  });
}); 

/**
 * Apply promo code and return discount
 */
export const applyPromoCode = catchAsync(async (req, res) => {
  const { code, planId } = req.body;

  const promoCode = await PromoCode.findOne({ 
    code: code.toUpperCase(),
    isActive: true,
    // expiresAt: { $gt: new Date() },
    // usedCount: { $lt: usageLimit }
  });

  if (!promoCode) {
    throw new APIError('Invalid or expired promo code', httpStatus.BAD_REQUEST);
  }

  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new APIError('Plan not found', httpStatus.NOT_FOUND);
  }

  const discountAmount = (plan.price * promoCode.discountPercent) / 100;
  const finalAmount = plan.price - discountAmount;

  res.json({
    success: true,
     data:{
      code: promoCode.code,
      discountPercent: promoCode.discountPercent,
      discountAmount,
      finalAmount,
      originalAmount: plan.price
    },
    message: 'Promo code applied successfully'
  });
});


/**
 * Create order and generate Razorpay payment link
 */
export const createOrder = catchAsync(async (req, res) => {
  const { planId, courseId, promoCode, paymentMethod, billingInfo } = req.body;
  const userId = req.user.id;

  // Validate plan
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new APIError('Plan not found', httpStatus.NOT_FOUND);
  }

  // Validate course (if provided)
  if (courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new APIError('Course not found', httpStatus.NOT_FOUND);
    }
  }
  const existingOrder = await Order.findOne({ userId, courseId });
    if (existingOrder) {
      return res.status(httpStatus.CONFLICT).json({
        success: false,
        message: 'You already have an order for this course',
        orderStatus: existingOrder.status, // e.g., 'pending', 'paid', 'failed'
      });
    }
  

  // Validate promo code (if provided)
  let promoCodeDoc = null;
  let finalAmount = plan.price;
  if (promoCode) {
    promoCodeDoc = await PromoCode.findOne({ 
      code: promoCode.toUpperCase(),
      isActive: true,
      // expiresAt: { $gt: new Date() },
      // usedCount: { $lt: usageLimit }
    });
    if (!promoCodeDoc) {
      throw new APIError('Invalid or expired promo code', httpStatus.BAD_REQUEST);
    }
    finalAmount = plan.price - (plan.price * promoCodeDoc.discountPercent) / 100;
  }

  // Create order record
  const order = await Order.create({
    userId,
    planId,
    courseId,
    promoCodeId: promoCodeDoc?._id,
    amount: finalAmount,
    paymentMethod,
    transactionId: `order_${Date.now()}_${userId}`,
    billingInfo
  }); 
  // Create Razorpay order
  // const razorpayOrder = await razorpay.orders.create({
  //   amount: Math.round(finalAmount * 100), // Razorpay expects paise
  //   currency: plan.currency,
  //   receipt: order._id.toString(),
  //   notes: {
  //     userId: userId.toString(),
  //     planId: planId.toString()
  //   }
  // });

  // // Update order with Razorpay order ID
  // order.transactionId = razorpayOrder.id;
  // await order.save();

  res.json({
    success: true,
     data:{
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: finalAmount,
      currency: plan.currency,
      keyId: config.razorpay.keyId,
      name: plan.name,
      description: `Payment for ${plan.name} plan`
    },
    message: 'Order created successfully'
  });
}); 

/**
 * Verify payment signature and update order status
 */
export const verifyPayment = catchAsync(async (req, res) => {
  const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

  // Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${orderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    throw new APIError('Invalid payment signature', httpStatus.UNAUTHORIZED);
  }

  // Update order status
  const order = await Order.findById(orderId);
  if (!order) {
    throw new APIError('Order not found', httpStatus.NOT_FOUND);
  }

  order.status = 'success';
  order.completedAt = new Date();
  await order.save();

  // Update user's plan (if needed)
  // TODO: Implement plan assignment logic

  res.json({
    success: true,
     data:{ orderId, status: 'success' },
    message: 'Payment verified successfully'
  });
});

/**
 * Get order by ID (for success/failure screens)
 */
export const getOrderById = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate('planId', 'name price features')
    .populate('courseId', 'title')
    .lean();

  if (!order) {
    throw new APIError('Order not found', httpStatus.NOT_FOUND);
  }

  // Authorization: only allow user to view their own order
  if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new APIError('Not authorized to view this order', httpStatus.FORBIDDEN);
  }

  res.json({
    success: true,
     data:{order},
    message: 'Order retrieved successfully'
  });
});
