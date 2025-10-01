import express from 'express';
import authenticate from '~/middlewares/authenticate.js';
import * as certificateController from '~/controllers/certificateController.js';

const router = express.Router();

// Public routes (certificates can be viewed by anyone with ID)
router.get('/:certificateId', certificateController.getCertificateById);
// router.get('/:certificateId/verify', certificateController.verifyCertificate);
router.get('/:certificateId/download', certificateController.downloadCertificate);

// // Protected routes (require auth)
router.use(authenticate());

// router.post('/:certificateId/share', certificateController.shareCertificate);
router.get('/user/:userId', certificateController.getCertificatesByUser);

export default router;