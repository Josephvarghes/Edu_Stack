// import { Router } from 'express';
// import catchAsync from '~/utils/catchAsync';
// import authenticate from '~/middlewares/authenticate';
// import validate from '~/middlewares/validate';
// import { createQuiz, getQuizByCourse, updateQuiz, deleteQuiz } from '~/controllers/quizController';
// const router = Router();

// // Get all quizzes for a course (students can view)
// router.get('/course/:courseId', authenticate('user:read'), catchAsync(getQuizByCourse));

// // Create a quiz (only instructor/admin)
// router.post('/', authenticate('quiz:create'), catchAsync(createQuiz));

// // Update a quiz (only creator or admin)
// router.put('/:quizId',authenticate('quiz:update'), catchAsync(updateQuiz));

// // Delete a quiz (only creator or admin)
// router.delete('/:quizId',authenticate('quiz:delete'), catchAsync(deleteQuiz));
// export default router;

// routes/quizRoutes.js
import express from 'express';
import authenticate from '~/middlewares/authenticate.js';
import * as quizController from '~/controllers/quizController.js';

const router = express.Router();

// Public route
router.get('/', quizController.listQuizzes);


// Quiz taking flow (requires auth)
router.use(authenticate()); // all below require login

router.get('/:quizId', quizController.getQuizById); 
router.post('/:quizId/start', quizController.startQuiz);
router.get('/:quizId/question/:questionIndex', quizController.getQuestionByIndex);
router.post('/:quizId/answer', quizController.submitAnswer);
router.post('/:quizId/preview-submit', quizController.previewSubmit);
router.post('/:quizId/submit', quizController.submitQuiz);
router.get('/:quizId/summary', quizController.getQuizSummary);
router.get('/:quizId/review-answers', quizController.getReviewAnswers);


// Protected routes (tutor/admin)
router.use(authenticate('quiz:create')); // or check ownership in controller

router.post('/', quizController.createQuiz);
router.put('/:quizId', quizController.updateQuiz);
router.delete('/:quizId', quizController.deleteQuiz);

export default router;