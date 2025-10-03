import httpStatus from 'http-status';
import APIError from '~/utils/apiError.js';
import catchAsync from '~/utils/catchAsync.js';
import Enrollment from '~/models/enrollmentModel';
import Lesson from '~/models/lessonModel';

/**
 * Update video progress for a lesson
 */
export const updateVideoProgress = catchAsync(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { currentTime } = req.body;
  const userId = req.user.id;

  // Validate lesson exists and belongs to course
  const lesson = await Lesson.findById(lessonId);
  if (!lesson || lesson.courseId.toString() !== courseId) {
    throw new APIError('Invalid lesson', httpStatus.NOT_FOUND);
  }

  // Find or create enrollment
  let enrollment = await Enrollment.findOne({ userId, courseId });
  if (!enrollment) {
    throw new APIError('Not enrolled in this course', httpStatus.FORBIDDEN);
  }

  // Find existing progress for this lesson
  const progressIndex = enrollment.lessonProgress.findIndex(
    p => p.lessonId.toString() === lessonId
  );

  if (progressIndex !== -1) {
    // Update existing progress
    enrollment.lessonProgress[progressIndex].currentTime = currentTime;
    enrollment.lessonProgress[progressIndex].lastWatchedAt = new Date();
  } else {
    // Add new progress record
    enrollment.lessonProgress.push({
      lessonId,
      currentTime,
      lastWatchedAt: new Date()
    });
  }

  // Save enrollment
  await enrollment.save();

  // Calculate progress percentage
  const progressPercent = Math.min(100, Math.round((currentTime / lesson.duration) * 100));

  res.json({
    success: true,
     data:{
      lessonId,
      currentTime,
      progressPercent,
      totalDuration: lesson.duration
    },
    message: 'Video progress updated successfully'
  });
});

/**
 * Get video progress for a lesson
 */
export const getVideoProgress = catchAsync(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const userId = req.user.id;

  const enrollment = await Enrollment.findOne({ userId, courseId });
  if (!enrollment) {
    throw new APIError('Not enrolled in this course', httpStatus.FORBIDDEN);
  }

  const progress = enrollment.lessonProgress.find(
    p => p.lessonId.toString() === lessonId
  );

  if (!progress) {
    return res.json({
      success: true,
       data:{ currentTime: 0, progressPercent: 0 },
      message: 'No progress found'
    });
  }

  const lesson = await Lesson.findById(lessonId);
  const progressPercent = Math.min(100, Math.round((progress.currentTime / lesson.duration) * 100));

  res.json({
    success: true,
     data:{
      currentTime: progress.currentTime,
      progressPercent,
      totalDuration: lesson.duration,
      lastWatchedAt: progress.lastWatchedAt
    },
    message: 'Video progress retrieved successfully'
  });
});