import httpStatus from 'http-status';
import APIError from '~/utils/apiError.js';
import catchAsync from '~/utils/catchAsync.js';
import Course from '~/models/courseModel';
import Lesson from '~/models/lessonModel';
import Enrollment from '~/models/enrollmentModel';
import Wishlist from '~/models/wishlistModel';
import Review from '~/models/reviewModel';
import User from '~/models/userModel'; 
import Quiz from '~/models/quizModel'; 
import Media from '~/models/mediaModel';

// ─── COURSE CRUD ───────────────────────────────────────────────

export const createCourse = catchAsync(async (req, res) => {
  const course = await Course.create({ ...req.body, tutor: req.user.id });
  res.status(httpStatus.CREATED).json({
    success: true,
    data: course,
    message: 'Course created successfully'
  });
});

export const getCourseById = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.courseId)
    .populate('tutor', 'fullName email')
    .lean();

  if (!course) {
    throw new APIError('Course not found', httpStatus.NOT_FOUND);
  }

  // Get lessons
  const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 }).lean();

  // Get reviews
  const reviews = await Review.find({ courseId: course._id })
    .populate('userId', 'fullName')
    .lean(); 

  const quizzes = await Quiz.find({ courseId: course._id })
  .sort({ createdAt: 1 }) // optional: sort by created date
  .lean(); 


  // 🔹 Get media (both course-level & lesson-level)
  const media = await Media.find({
    $or: [
      { courseId: course._id }, // course-level media
      { lessonId: { $in: lessons.map(l => l._id) } } // lesson-level media
    ]
  }).lean();

  // Group media by lessonId (for easier frontend use)
  const mediaByLesson = {};
  lessons.forEach(lesson => {
    mediaByLesson[lesson._id] = [];
  });

  media.forEach(m => {
    if (m.lessonId) {
      if (!mediaByLesson[m.lessonId]) mediaByLesson[m.lessonId] = [];
      mediaByLesson[m.lessonId].push(m);
    }
  });

  // Attach media to each lesson
  const lessonsWithMedia = lessons.map(lesson => ({
    ...lesson,
    media: mediaByLesson[lesson._id] || []
  }));


  res.json({
    success: true,
    data: { ...course,lessons,lessonsWithMedia, reviews, quizzes },
    message: 'Course retrieved successfully'
  });
});

export const updateCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    throw new APIError('Course not found', httpStatus.NOT_FOUND);
  }

  // Authorization: only tutor or admin
  if (req.user.role !== 'admin' && course.tutor.toString() !== req.user.id) {
    throw new APIError('Not authorized', httpStatus.FORBIDDEN);
  }

  Object.assign(course, req.body);
  await course.save();

  res.json({
    success: true,
    data: course,
    message: 'Course updated successfully'
  });
});

export const deleteCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    throw new APIError('Course not found', httpStatus.NOT_FOUND);
  }

  if (req.user.role !== 'admin' && course.tutor.toString() !== req.user.id) {
    throw new APIError('Not authorized', httpStatus.FORBIDDEN);
  }

  await course.deleteOne();
  res.json({
    success: true,
    data: {},
    message: 'Course deleted successfully'
  });
});

// ─── SEARCH & LIST ─────────────────────────────────────────────

export const searchCourses = catchAsync(async (req, res) => {
  const { search, category, price, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;

  let filter = {};
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  if (category) filter.category = category;
  if (price === 'free') filter.price = 0;
  if (price === 'paid') filter.price = { $gt: 0 };

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const courses = await Course.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('tutor', 'fullName')
    .lean();

  const total = await Course.countDocuments(filter);

  res.json({
    success: true,
    data: courses,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
    message: 'Courses retrieved successfully'
  });
});

// ─── ENROLLMENT ────────────────────────────────────────────────

export const enrollInCourse = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.id;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: {},
      message: 'Course not found'
    });
  }

  // Check if already enrolled
  let enrollment = await Enrollment.findOne({ userId, courseId });
  if (enrollment) {
    return res.status(httpStatus.CONFLICT).json({
      success: false,
      data: {},
      message: 'Already enrolled in this course'
    });
  }


  enrollment = await Enrollment.create({ userId, courseId });
  res.status(httpStatus.CREATED).json({
    success: true,
    data: enrollment,
    message: 'Enrolled in course successfully'
  });
});

export const getUserEnrollments = catchAsync(async (req, res) => {
  const enrollments = await Enrollment.find({ userId: req.user.id })
    .populate('courseId', 'title thumbnail rating')
    .lean();

  res.json({
    success: true,
    data: enrollments,
    message: 'Enrollments retrieved successfully'
  });
});

export const markLessonComplete = catchAsync(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const userId = req.user.id;

  // Verify lesson belongs to course
  const lesson = await Lesson.findById(lessonId);
  if (!lesson || lesson.courseId.toString() !== courseId) {
    throw new APIError('Invalid lesson', httpStatus.NOT_FOUND);
  }

  let enrollment = await Enrollment.findOne({ userId, courseId });
  if (!enrollment) {
    throw new APIError('Not enrolled in this course', httpStatus.FORBIDDEN);
  }

  // Add to completed if not already
  if (!enrollment.completedLessons.includes(lessonId)) {
    enrollment.completedLessons.push(lessonId);
    const totalLessons = await Lesson.countDocuments({ courseId });
    enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
    enrollment.lastAccessedAt = new Date();
    if (enrollment.progress === 100) enrollment.isCompleted = true;
    await enrollment.save();
  }

  res.json({
    success: true,
    data: { progress: enrollment.progress },
    message: 'Lesson marked as complete'
  });
});

// ─── WISHLIST ──────────────────────────────────────────────────

// export const addToWishlist = catchAsync(async (req, res) => {
//   const { courseId } = req.body;
//   const userId = req.user.id;

//   const course = await Course.findById(courseId);
//   if (!course) {
//     return res.status(httpStatus.NOT_FOUND).json({
//       success: false,
//       data: {},
//       message: 'Course not found'
//     });
//   }

//   const wishlistItem = await Wishlist.create({ userId, courseId });
//   res.status(httpStatus.CREATED).json({
//     success: true,
//     data: wishlistItem,
//     message: 'Added to wishlist'
//   });
// });

export const addToWishlist = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.id;

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: {},
      message: 'Course not found'
    });
  }

  // Check if already in wishlist
  const existingItem = await Wishlist.findOne({ userId, courseId });
  if (existingItem) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      data: {},
      message: 'Course already in wishlist'
    });
  }

  // Add to wishlist
  const wishlistItem = await Wishlist.create({ userId, courseId });

  res.status(httpStatus.CREATED).json({
    success: true,
    data: wishlistItem,
    message: 'Added to wishlist'
  });
});

export const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await Wishlist.find({ userId: req.user.id })
    .populate('courseId') 
    .lean();

  res.json({
    success: true,
    data: wishlist,
    message: 'Wishlist retrieved successfully'
  });
});

export const removeFromWishlist = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const result = await Wishlist.deleteOne({ userId, courseId });
  if (result.deletedCount === 0) {
    throw new APIError('Item not found in wishlist', httpStatus.NOT_FOUND);
  }

  res.json({
    success: true,
    data: {},
    message: 'Removed from wishlist'
  });
});

// ─── REVIEWS ───────────────────────────────────────────────────

export const addReview = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  // Check enrollment (only enrolled users can review)
  const enrollment = await Enrollment.findOne({ userId, courseId}); //add progress: { $gt: 0 } if need

  if (!enrollment) {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      data: {},
      message: 'You must be enrolled in the course to leave a review'
    });
  }

  const review = await Review.create({ courseId, userId, rating, comment });

  // Update course rating
  const reviews = await Review.find({ courseId });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Course.findByIdAndUpdate(courseId, {
    rating: parseFloat(avgRating.toFixed(2)),
    ratingsCount: reviews.length
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    data: review,
    message: 'Review added successfully'
  });
}); 

  export const getCourseReviews = catchAsync(async (req, res) => {
    const { courseId } = req.params;

    const reviews = await Review.find({ courseId })
      .populate('userId', 'fullName avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      reviews,
      message: 'Reviews retrieved successfully'
    });
  });

// ─── RELATED COURSES ───────────────────────────────────────────

export const getRelatedCourses = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    throw new APIError('Course not found', httpStatus.NOT_FOUND);
  }

  const related = await Course.find({
    _id: { $ne: course._id },
    category: course.category
  })
  .limit(4)
  .populate('tutor', 'fullName')
  .lean();

  res.json({
    success: true,
    data: related,
    message: 'Related courses retrieved successfully'
  });
}); 

export const getCoursesByCategory = catchAsync(async (req, res) => {
  const { categoryName } = req.params;
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Build sort object
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  // Fetch courses
  const courses = await Course.find({ category: categoryName })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('tutor', 'fullName email')
    .lean();

  const total = await Course.countDocuments({ category: categoryName });

  res.json({
    success: true,
    data: courses,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total
    },
    message: `Courses in category "${categoryName}" retrieved successfully`
  });
}); 

export const getAllCourses = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Only show published courses
  const filter = { isPublished: true };

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const courses = await Course.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('tutor', 'fullName email')
    .lean();

  const total = await Course.countDocuments(filter);

  res.json({
    success: true,
     courses,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total
    },
    message: 'All courses retrieved successfully'
  });
});