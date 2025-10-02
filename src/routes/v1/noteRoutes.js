import express from 'express';
import authenticate from '~/middlewares/authenticate.js';
import * as noteController from '~/controllers/noteController.js';

const router = express.Router();

// Protected routes (require auth)
router.use(authenticate());

router.post('/', noteController.createNote);
router.get('/user/:userId', noteController.getNotesByUser);
router.get('/course/:courseId', noteController.getNotesByCourse);
router.put('/:noteId', noteController.updateNote);
router.delete('/:noteId', noteController.deleteNote);

export default router;