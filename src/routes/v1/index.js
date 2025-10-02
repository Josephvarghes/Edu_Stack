import { Router } from 'express';
import authRoute from './authRoute';
import userRoute from './userRoute';
import roleRoute from './roleRoute';
import imageRoute from './imageRoute'; 
import quizRoute from './quizRoutes';
import courseRoute from './courseRoutes';
import progressRoute from './progressRoute'; 
import certificateRoutes from './certificateRoutes'; 
import paymentRoutes from './paymentRoutes'; 
import videoRoutes from './videoRoutes'; 
import tutorRoutes from './tutorRoutes.js'; 
import otpRoutes from './otpRoutes';
import lessonRoutes from './lessonRoutes'; 
import noteRoutes from './noteRoutes';

const router = Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/roles', roleRoute);
router.use('/images', imageRoute); 
router.use('/quiz', quizRoute); 
router.use('/course', courseRoute);  
router.use('/progress', progressRoute); 
router.use('/certificates', certificateRoutes);
router.use('/payments', paymentRoutes); 
router.use('/videos', videoRoutes);
router.use('/tutor', tutorRoutes); 
router.use('/otp', otpRoutes);  
router.use('/lessons', lessonRoutes); 
router.use('/notes', noteRoutes); 







export default router;
