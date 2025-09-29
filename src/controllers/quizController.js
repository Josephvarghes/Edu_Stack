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


/**
 * Start a quiz attempt
 */
export const startQuiz = catchAsync(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  // Verify quiz exists
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'Quiz not found'
    });
  } 

  // Check if user is enrolled in the course (optional but recommended)
  const enrollment = await Course.exists({
    _id: quiz.courseId,
    'enrollments.userId': userId
  });
  if (!enrollment) {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      data: null,
      message: 'You must be enrolled in the course to take this quiz'
    });
  }
  

  // Create new attempt
  const attempt = await QuizAttempt.create({
    userId,
    quizId,
    totalPoints: quiz.questions.length // 1 point per question
  });

  // Return first question
  const firstQuestion = quiz.questions[0];
  res.json({
    success: true,
    data: {
      attemptId: attempt._id,
      questionIndex: 0,
      question: firstQuestion.question,
      options: firstQuestion.options,
      totalQuestions: quiz.questions.length,
      timeLimit: quiz.timeLimit,
      currentAnswer: null
    },
    message: 'Quiz started successfully'
  });
});


export const getQuestionByIndex = catchAsync(async (req, res) => {
  const { quizId, questionIndex } = req.params;
  const userId = req.user.id;
  const index = parseInt(questionIndex, 10);

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'Quiz not found'
    });
  }

  if (index < 0 || index >= quiz.questions.length) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      data: null,
      message: 'Invalid question index'
    });
  }
  

  // Find user's attempt
  const attempt = await QuizAttempt.findOne({ userId, quizId, isCompleted: false });
  if (!attempt) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'No active quiz attempt found'
    });
  }
  

  const question = quiz.questions[index];
  const userAnswer = attempt.answers.find(a => a.questionIndex === index);

  res.json({
    success: true,
    data: {
      attemptId: attempt._id,
      questionIndex: index,
      question: question.question,
      options: question.options,
      totalQuestions: quiz.questions.length,
      timeLimit: quiz.timeLimit,
      currentAnswer: userAnswer ? userAnswer.selectedOptionIndex : null,
      isSavedForReview: userAnswer ? userAnswer.isSavedForReview : false
    },
    message: 'Question retrieved successfully'
  });
});


/**
 * Submit answer for a question
 */
export const submitAnswer = catchAsync(async (req, res) => {
  const { quizId } = req.params;
  const { questionIndex, selectedOptionIndex, isSavedForReview = false } = req.body;
  const userId = req.user.id;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
     return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'Quiz not found'
    });
  }

  const index = parseInt(questionIndex, 10);
  if (index < 0 || index >= quiz.questions.length) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      data: null,
      message: 'Invalid question index'
    });
  } 


  if (selectedOptionIndex < 0 || selectedOptionIndex >= quiz.questions[index].options.length) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      data: null,
      message: 'Invalid option index'
    });
  }
  

  // Find active attempt
  let attempt = await QuizAttempt.findOne({ userId, quizId, isCompleted: false });
  if (!attempt) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'No active quiz attempt found'
    });
  }
  

  const correctAnswer = quiz.questions[index].correctAnswer;
  const isCorrect = selectedOptionIndex === correctAnswer;

  // Update or add answer
  const existingAnswerIndex = attempt.answers.findIndex(a => a.questionIndex === index);
  if (existingAnswerIndex !== -1) {
    attempt.answers[existingAnswerIndex].selectedOptionIndex = selectedOptionIndex;
    attempt.answers[existingAnswerIndex].isCorrect = isCorrect;
    attempt.answers[existingAnswerIndex].isSavedForReview = isSavedForReview;
  } else {
    attempt.answers.push({
      questionIndex: index,
      selectedOptionIndex,
      isCorrect,
      isSavedForReview
    });
    attempt.answeredCount += 1;
    attempt.unansweredCount = quiz.questions.length - attempt.answeredCount;
    
    if (isCorrect) {
      attempt.earnedPoints += 1;
    }
  }

  await attempt.save();

  // Prepare response
  const nextIndex = index + 1;
  const hasNext = nextIndex < quiz.questions.length;

  res.json({
    success: true,
    data: {
      attemptId: attempt._id,
      questionIndex: index,
      isCorrect,
      hasNext,
      nextQuestionIndex: hasNext ? nextIndex : null,
      score: attempt.earnedPoints,
      totalQuestions: quiz.questions.length
    },
    message: 'Answer submitted successfully'
  });
}); 

// controllers/quizController.js
export const getQuizSummary = catchAsync(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'Quiz not found'
    });
  }

  const attempt = await QuizAttempt.findOne({ userId, quizId, isCompleted: false });
  if (!attempt) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'No active quiz attempt found'
    });
  }

  const totalQuestions = quiz.questions.length;
  const answeredCount = attempt.answers.filter(a => a.selectedOptionIndex !== undefined).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Calculate time taken (in minutes)
  const timeTakenMs = Date.now() - attempt.startedAt.getTime();
  const timeTakenMin = Math.floor(timeTakenMs / 60000);

  // Get list of unanswered question indices
  const unansweredQuestionIndices = [];
  for (let i = 0; i < totalQuestions; i++) {
    if (!attempt.answers.find(a => a.questionIndex === i)) {
      unansweredQuestionIndices.push(i + 1); // 1-based index for display
    }
  }

  res.json({
    success: true,
     data:{
      totalQuestions,
      answeredCount,
      unansweredCount,
      timeTaken: timeTakenMin,
      timeLimit: quiz.timeLimit,
      unansweredQuestionIndices,
      scorePreview: Math.round((attempt.earnedPoints / totalQuestions) * 100),
      passingScore: quiz.passingScore,
      isPassed: Math.round((attempt.earnedPoints / totalQuestions) * 100) >= quiz.passingScore
    },
    message: 'Quiz summary retrieved successfully'
  });
});


export const getReviewAnswers = catchAsync(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'Quiz not found'
    });
  }

  const attempt = await QuizAttempt.findOne({ userId, quizId, isCompleted: false });
  if (!attempt) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'No active quiz attempt found'
    });
  }

  const totalQuestions = quiz.questions.length;
  const questionStatuses = [];

  for (let i = 0; i < totalQuestions; i++) {
    const answer = attempt.answers.find(a => a.questionIndex === i);
    let status = 'not_answered';
    if (answer) {
      status = answer.isCorrect ? 'correct' : 'incorrect';
    }
    questionStatuses.push({
      questionNumber: i + 1,
      status
    });
  }

  res.json({
    success: true,
     data:{
      questionStatuses,
      totalQuestions,
      answeredCount: attempt.answers.filter(a => a.selectedOptionIndex !== undefined).length,
      correctCount: attempt.answers.filter(a => a.isCorrect).length,
      incorrectCount: attempt.answers.filter(a => !a.isCorrect && a.selectedOptionIndex !== undefined).length,
      unansweredCount: totalQuestions - attempt.answers.filter(a => a.selectedOptionIndex !== undefined).length
    },
    message: 'Review answers retrieved successfully'
  });
});

export const submitQuiz = catchAsync(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'Quiz not found'
    });
  }

  let attempt = await QuizAttempt.findOne({ userId, quizId, isCompleted: false });
  if (!attempt) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'No active quiz attempt found'
    });
  }

  // Mark unanswered questions as incorrect
  const totalQuestions = quiz.questions.length;
  for (let i = 0; i < totalQuestions; i++) {
    const answer = attempt.answers.find(a => a.questionIndex === i);
    if (!answer) {
      attempt.answers.push({
        questionIndex: i,
        selectedOptionIndex: null,
        isCorrect: false,
        isSavedForReview: false,
        timeSpent: 0
      });
    }
  }

  // Recalculate score
  attempt.earnedPoints = attempt.answers.filter(a => a.isCorrect).length;
  attempt.score = Math.round((attempt.earnedPoints / totalQuestions) * 100);
  attempt.isCompleted = true;
  attempt.completedAt = new Date();

  await attempt.save();

  res.json({
    success: true,
     data:{
      attemptId: attempt._id,
      score: attempt.score,
      earnedPoints: attempt.earnedPoints,
      totalPoints: totalQuestions,
      isPassed: attempt.score >= quiz.passingScore,
      passingScore: quiz.passingScore
    },
    message: 'Quiz submitted successfully'
  });
});

export const previewSubmit = catchAsync(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'Quiz not found'
    });
  }

  const attempt = await QuizAttempt.findOne({ userId, quizId, isCompleted: false });
  if (!attempt) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      data: null,
      message: 'No active quiz attempt found'
    });
  }

  // Calculate score preview (unanswered = incorrect)
  const totalQuestions = quiz.questions.length;
  const earnedPoints = attempt.answers.filter(a => a.isCorrect).length;
  const scorePreview = Math.round((earnedPoints / totalQuestions) * 100);

  res.json({
    success: true,
     data:{
      attemptId: attempt._id,
      totalQuestions,
      answeredCount: attempt.answers.filter(a => a.selectedOptionIndex !== undefined).length,
      unansweredCount: totalQuestions - attempt.answers.filter(a => a.selectedOptionIndex !== undefined).length,
      timeTaken: Math.floor((Date.now() - attempt.startedAt.getTime()) / 60000),
      timeLimit: quiz.timeLimit,
      scorePreview,
      passingScore: quiz.passingScore,
      isPassed: scorePreview >= quiz.passingScore,
      canSubmit: true // always true at this point
    },
    message: 'Quiz preview submitted successfully'
  });
});