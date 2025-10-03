// // src/routes/v1/mediaRoutes.js
// import { Router } from 'express';
// import multer from 'multer';
// import authenticate from '~/middlewares/authenticate.js';
// import * as mediaController from '~/controllers/mediaController.js';

// const router = Router();

// // Multer setup
// const TMP_DIR = './tmp';
// if (!require('fs').existsSync(TMP_DIR)) require('fs').mkdirSync(TMP_DIR);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, TMP_DIR),
//   filename: (req, file, cb) => {
//     const ext = require('path').extname(file.originalname) || '';
//     cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 1024 * 1024 * 1024 } // 1GB
// });

// // Routes
// router.post('/upload', authenticate(), upload.single('file'), mediaController.uploadMedia);
// router.get('/stream/:publicId(*)', mediaController.streamVideo); // Wildcard for paths

// // Existing routes
// // router.get('/:mediaId', mediaController.getMediaById);
// // router.get('/lesson/:lessonId', mediaController.getMediaByLesson);
// // router.get('/course/:courseId', mediaController.getMediaByCourse);

// export default router; 

// src/routes/v1/mediaRoutes.js
import fs from 'fs';
import { Router } from 'express';
import multer from 'multer';
import authenticate from '~/middlewares/authenticate.js';
import * as mediaController from '~/controllers/mediaController.js';
import path from 'path';

const router = Router();

// Multer setup
const TMP_DIR = './tmp';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TMP_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB
});

// Routes
router.post('/upload', authenticate(), upload.single('file'), mediaController.uploadMedia);
router.get('/video/:publicId(*)', mediaController.streamVideo);   // Wildcard for paths
router.get('/file/:publicId(*)', mediaController.getFile);        // Wildcard for paths
router.get('/:mediaId', mediaController.getMediaById);

export default router;