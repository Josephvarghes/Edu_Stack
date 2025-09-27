import express from 'express';
import authenticate from '~/middlewares/authenticate.js';
import * as courseController from '~/controllers/courseController.js';

const router = express.Router();

// ──────────────────────────────────────
// 🔓 PUBLIC ROUTES (NO AUTH REQUIRED)
// ──────────────────────────────────────

// Static public routes (MUST come before :params)
router.get('/all', courseController.getAllCourses);
router.get('/categories/:categoryName/courses', courseController.getCoursesByCategory);

// Dynamic public routes
router.get('/', courseController.searchCourses);
router.get('/:courseId', courseController.getCourseById);
router.get('/:courseId/related', courseController.getRelatedCourses);

// ──────────────────────────────────────
// 🔒 PROTECTED ROUTES (REQUIRE AUTH)
// ──────────────────────────────────────

// Apply auth middleware to all routes below
router.use(authenticate());

// Student actions
router.get('/wishlist', courseController.getWishlist);
router.post('/wishlist', courseController.addToWishlist);
router.delete('/wishlist/:courseId', courseController.removeFromWishlist);

router.post('/enroll', courseController.enrollInCourse);
router.get('/enrollments/me', courseController.getUserEnrollments);
router.post('/:courseId/lessons/:lessonId/complete', courseController.markLessonComplete);

router.post('/:courseId/reviews', courseController.addReview);
router.get('/:courseId/reviews', courseController.getCourseReviews);

// ──────────────────────────────────────
// 👨‍🏫 TUTOR/ADMIN ROUTES (REQUIRE PERMISSION)
// ──────────────────────────────────────

// Apply role-based auth for course management
router.use(authenticate('course:create'));

router.post('/', courseController.createCourse);
router.put('/:courseId', courseController.updateCourse);
router.delete('/:courseId', courseController.deleteCourse);

export default router;