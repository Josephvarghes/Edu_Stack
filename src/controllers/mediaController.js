import fs from 'fs';
import path from 'path';
import httpStatus from 'http-status';
import APIError from '~/utils/apiError.js';
import catchAsync from '~/utils/catchAsync.js';
import Media from '~/models/mediaModel';
import Course from '~/models/courseModel';
import Lesson from '~/models/lessonModel';
import cloudinary from '~/config/cloudinary.js';
import axios from 'axios';

// Constants
const BYTES_IN_MB = 1024 * 1024;
const FREE_PLAN_VIDEO_LIMIT_MB = 100;

/**
 * Upload media (video, pdf, docx, etc.)
 */
export const uploadMedia = catchAsync(async (req, res) => {
  const { courseId, lessonId, title, description, type } = req.body;
  const userId = req.user.id;

  // Validate course
  const course = await Course.findById(courseId);
  if (!course) {
    throw new APIError('Course not found', httpStatus.NOT_FOUND);
  }

  // Validate lesson (if provided)
  if (lessonId) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.courseId.toString() !== courseId) {
      throw new APIError('Invalid lesson', httpStatus.NOT_FOUND);
    }
  }

  // Validate file
  if (!req.file) {
    throw new APIError('No file uploaded', httpStatus.BAD_REQUEST);
  }

  const localPath = req.file.path;
  const fileSizeBytes = req.file.size;
  const fileSizeMB = fileSizeBytes / BYTES_IN_MB;
  const mimeType = req.file.mimetype;

  try {
    let result;
    let resourceType;

    if (type === 'video' || mimeType.startsWith('video/')) {
      resourceType = 'video';
      if (fileSizeMB <= FREE_PLAN_VIDEO_LIMIT_MB) {
        result = await cloudinary.uploader.upload(localPath, {
          resource_type: 'video',
          folder: `courses/${courseId}/${lessonId || 'documents'}`,
          use_filename: true,
          unique_filename: true
        });
      } else if (typeof cloudinary.uploader.upload_large === 'function') {
        result = await cloudinary.uploader.upload_large(localPath, {
          resource_type: 'video',
          folder: `courses/${courseId}/${lessonId || 'documents'}`,
          use_filename: true,
          unique_filename: true,
          chunk_size: 6000000
        });
      } else {
        result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'video', folder: `courses/${courseId}/${lessonId || 'documents'}` },
            (error, resRes) => error ? reject(error) : resolve(resRes)
          );
          fs.createReadStream(localPath).pipe(stream);
        });
      }
    } else {
      resourceType = 'raw';
      result = await cloudinary.uploader.upload(localPath, {
        resource_type: 'raw',
        folder: `courses/${courseId}/${lessonId || 'documents'}`,
        use_filename: true,
        unique_filename: true
      });
    }

    // Clean up temp file
    fs.unlinkSync(localPath);

    // Save to DB
    const media = await Media.create({
      courseId,
      lessonId,
      title,
      description,
      type,
      publicId: result.public_id,
      resourceType,
      url: result.secure_url,
      thumbnailUrl: result.thumbnail_url || null,
      duration: result.duration || 0,
      pages: result.pages || 0,
      size: result.bytes,
      tags: []
    });

    res.json({
      success: true,
       media,
      message: 'Media uploaded successfully'
    });

  } catch (error) {
    try { fs.unlinkSync(localPath); } catch (e) {}
    throw new APIError(`Upload failed: ${error.message}`, httpStatus.INTERNAL_SERVER_ERROR);
  }
});

/**
 * Stream video with Range support
 */
export const streamVideo = catchAsync(async (req, res) => {
  const { publicId } = req.params;
  if (!publicId) {
    throw new APIError('Missing public ID', httpStatus.BAD_REQUEST);
  }

  const fullUrl = cloudinary.url(publicId, { resource_type: 'video', secure: true });

  try {
    const headers = {};
    if (req.headers.range) headers.range = req.headers.range;

    const cloudResp = await axios({
      url: fullUrl,
      method: 'GET',
      responseType: 'stream',
      headers,
      timeout: 0
    });

    if (cloudResp.headers['content-type']) 
      res.setHeader('content-type', cloudResp.headers['content-type']);
    if (cloudResp.headers['content-length']) 
      res.setHeader('content-length', cloudResp.headers['content-length']);
    if (cloudResp.headers['accept-ranges']) 
      res.setHeader('accept-ranges', cloudResp.headers['accept-ranges']);
    if (cloudResp.status === 206) 
      res.status(206);

    cloudResp.data.pipe(res);
  } catch (error) {
    res.redirect(cloudinary.url(publicId, { resource_type: 'video', secure: true }));
  }
});

/**
 * Deliver PDF/DOCX file
 */
export const getFile = catchAsync(async (req, res) => {
  const { publicId } = req.params;
  if (!publicId) {
    throw new APIError('Missing public ID', httpStatus.BAD_REQUEST);
  }

  const fullUrl = cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'upload',
    secure: true
  });

  res.redirect(fullUrl);
});

// Existing getters (getMediaById, etc.)
export const getMediaById = catchAsync(async (req, res) => {
  const media = await Media.findById(req.params.mediaId).lean();
  if (!media) {
    throw new APIError('Media not found', httpStatus.NOT_FOUND);
  }
  res.json({ success: true,  media, message: 'Media retrieved successfully' });
});