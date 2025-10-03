import express from 'express';
import authenticate from '~/middlewares/authenticate.js';
import * as videoProgressController from '~/controllers/videoProgressController.js';

const router = express.Router();

// Protected routes (require auth)
router.use(authenticate());

router.post('/:courseId/lessons/:lessonId/progress', videoProgressController.updateVideoProgress);
router.get('/:courseId/lessons/:lessonId/progress', videoProgressController.getVideoProgress);

export default router;