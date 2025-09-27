// import Quiz from '~/models/quizModel.js';
// import catchAsync from '~/utils/catchAsync.js';

// /**
//  * Create a quiz
//  */
// export const createQuiz = catchAsync(async (req, res) => {
//   const { course, title, questions } = req.body;

//   const quiz = await Quiz.create({
//     course,
//     title,
//     questions,
//     createdBy: req.user.id
//   });

//   return res.status(201).json({
//     success: true,
//     data: quiz
//   });
// });

// /**
//  * Get quizzes by course
//  */
// export const getQuizByCourse = catchAsync(async (req, res) => {
//   const { courseId } = req.params;
//   const quizzes = await Quiz.find({ course: courseId })
//     .populate('createdBy', 'firstName lastName');

//   return res.json({
//     success: true,
//     data: quizzes
//   });
// });

// /**
//  * Update a quiz (only creator or admin)
//  */
// export const updateQuiz = catchAsync(async (req, res) => {
//   const { quizId } = req.params;

//   // optional: enforce ownership unless admin
//   const filter = req.user.role === 'admin'
//     ? { _id: quizId }
//     : { _id: quizId, createdBy: req.user.id };

//   const quiz = await Quiz.findOneAndUpdate(filter, req.body, {
//     new: true,
//     runValidators: true
//   });

//   if (!quiz) {
//     return res.status(404).json({ success: false, message: 'Quiz not found or not allowed' });
//   }

//   return res.json({
//     success: true,
//     data: quiz
//   });
// });

// /**
//  * Delete a quiz (only creator or admin)
//  */
// export const deleteQuiz = catchAsync(async (req, res) => {
//   const { quizId } = req.params;

//   const filter = req.user.role === 'admin'
//     ? { _id: quizId }
//     : { _id: quizId, createdBy: req.user.id };

//   const quiz = await Quiz.findOneAndDelete(filter);

//   if (!quiz) {
//     return res.status(404).json({ success: false, message: 'Quiz not found or not allowed' });
//   }

//   return res.json({
//     success: true,
//     message: 'Quiz deleted successfully'
//   });
// });

// controllers/quizController.js
import httpStatus from 'http-status';
import APIError from '~/utils/apiError.js';
import catchAsync from '~/utils/catchAsync.js';
import Quiz from '~/models/quizModel';
import QuizAttempt from '~/models/quizAttemptModel'; 
import Course from '~/models/courseModel';


export const createQuiz = catchAsync(async (req, res) => {
  const { courseId } = req.body;

  // Verify course exists and user is owner
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'Course not found'
    });
  }

  if (course.tutor.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      data: null,
      message: 'Not authorized to create quiz for this course'
    });
  }

  const quiz = await Quiz.create({ ...req.body, createdBy: req.user.id });
  res.status(httpStatus.CREATED).json({
    success: true,
     data:{quiz},
    message: 'Quiz created successfully'
  });
});


export const getQuizById = catchAsync(async (req, res) => {
  const { quizId } = req.params;

  // Fetch quiz
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) {
    throw new APIError('Quiz not found', httpStatus.NOT_FOUND);
  }

  // Fetch user's previous attempts (if logged in)
  let previousAttempts = [];
  if (req.user) {
    previousAttempts = await QuizAttempt.find({
      userId: req.user.id,
      quizId: quiz._id
    })
    .sort({ completedAt: -1 })
    .limit(5)
    .lean();
  }

  res.json({
    success: true,
    data: {
      ...quiz,
      previousAttempts
    },
    message: 'Quiz details retrieved successfully'
  });
}); 

/**
 * List quizzes with filters
 */
export const listQuizzes = catchAsync(async (req, res) => {
  const { courseId, subject, isActive, page = 1, limit = 10 } = req.query;

  let filter = {};
  if (courseId) filter.courseId = courseId;
  if (subject) filter.subject = subject;
  if (isActive !== undefined) filter.isActive = isActive;

  const quizzes = await Quiz.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Quiz.countDocuments(filter);

  res.json({
    success: true,
     quizzes,
    pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total },
    message: 'Quizzes retrieved successfully'
  });
});

/**
 * Update quiz
 */
export const updateQuiz = catchAsync(async (req, res) => {
  const { quizId } = req.params;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
   return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'Quiz not found'
    });
  }
  
  // Verify ownership
  const course = await Course.findById(quiz.courseId);
  if (course.tutor.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      data: null,
      message: 'Not authorized to update this quiz'
    });
  }
  

  Object.assign(quiz, req.body);
  await quiz.save();

  res.json({
    success: true,
    data:{quiz},
    message: 'Quiz updated successfully'
  });
});

/**
 * Delete quiz
 */
export const deleteQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId);
  if (!quiz) {
    throw new APIError('Quiz not found', httpStatus.NOT_FOUND);
  }

  const course = await Course.findById(quiz.courseId);
  if (course.tutor.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new APIError('Not authorized to delete this quiz', httpStatus.FORBIDDEN);
  }

  await quiz.deleteOne();
  res.json({
    success: true,
     data:{},
    message: 'Quiz deleted successfully'
  });
});