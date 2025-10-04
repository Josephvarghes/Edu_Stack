// src/controllers/dashboardController.js
import httpStatus from 'http-status';
import APIError from '~/utils/apiError.js';
import catchAsync from '~/utils/catchAsync.js';
import Course from '~/models/courseModel';
import Enrollment from '~/models/enrollmentModel';
import QuizAttempt from '~/models/quizAttemptModel';
import Order from '~/models/orderModel';
import Certificate from '~/models/certificateModel';

/**
 * Get main dashboard data for student
 */
export const getDashboardData = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // 1. Get active enrollments (with course data)
  const enrollments = await Enrollment.find({ userId, isCompleted: false })
    .populate('courseId', 'title thumbnail rating')
    .lean();

  const activeCourses = enrollments.length;
  const totalLessons = enrollments.reduce((sum, e) => sum + (e.totalLessons || 0), 0);
  const completedLessons = enrollments.reduce((sum, e) => sum + (e.completedLessons || 0), 0);
  const studyTimeHours = enrollments.reduce((sum, e) => sum + (e.studyTimeHours || 0), 0);

  // 2. Get upcoming classes (mock data for now)
  const upcomingClasses = 3; // You can replace with real schedule logic later

  // 3. Get certificates count
  const certificatesCount = await Certificate.countDocuments({ userId });

  // 4. Get current subscription plan
  let currentPlan = 'Free';
  const latestOrder = await Order.findOne({ userId, status: 'success' })
    .sort({ completedAt: -1 })
    .populate('planId', 'name')
    .lean();

  if (latestOrder && latestOrder.planId) {
    currentPlan = latestOrder.planId.name;
  }

  // 5. Weekly goal tracking (mock: 10h/week)
  const weeklyGoalHours = 10;
  const weeklyProgressPercent = Math.min(100, Math.round((studyTimeHours / weeklyGoalHours) * 100));

  // 6. Tasks completed (mock: 4/6)
  const tasksCompleted = 4;
  const totalTasks = 6;

  res.json({
    success: true,
     data:{
      greeting: `Hello ${req.user.fullName} 👋`,
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      quickActions: {
        myCourses: {
          count: activeCourses,
          label: activeCourses === 1 ? 'Active Course' : 'Active Courses',
          action: 'Continue Learning'
        },
        upcomingClasses: {
          count: upcomingClasses,
          label: upcomingClasses === 1 ? 'Class Today' : 'Classes Today',
          action: 'View Schedule'
        },
        progress: {
          percent: Math.round((completedLessons / (totalLessons || 1)) * 100),
          action: 'View Details'
        },
        certificates: {
          count: certificatesCount,
          action: 'Download All'
        },
        payments: {
          plan: currentPlan,
          action: 'Manage billing & subscriptions'
        }
      },
      dailyProgress: {
        studyTime: {
          hours: Math.floor(studyTimeHours),
          minutes: Math.round((studyTimeHours % 1) * 60),
          weeklyGoal: weeklyGoalHours,
          weeklyProgressPercent
        },
        tasks: {
          completed: tasksCompleted,
          total: totalTasks
        }
      }
    },
    message: 'Dashboard data retrieved successfully'
  });
});

/**
 * Get detailed progress tracker data
 */
export const getProgressTrackerData = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // 1. Get all enrollments (active + completed)
  const enrollments = await Enrollment.find({ userId })
    .populate('courseId', 'title subject')
    .lean();

  const totalCourses = enrollments.length;
  const activeCourses = enrollments.filter(e => !e.isCompleted).length;

  // Calculate overall progress
  const totalLessons = enrollments.reduce((sum, e) => sum + (e.totalLessons || 0), 0);
  const completedLessons = enrollments.reduce((sum, e) => sum + (e.completedLessons || 0), 0);
  const overallProgressPercent = Math.round((completedLessons / (totalLessons || 1)) * 100);
  const studyTimeHours = enrollments.reduce((sum, e) => sum + (e.studyTimeHours || 0), 0);

  // 2. Course progress details
  const courseProgress = enrollments.map(enrollment => ({
    courseId: enrollment.courseId._id,
    title: enrollment.courseId.title,
    subject: enrollment.courseId.subject,
    progressPercent: Math.round((enrollment.completedLessons / (enrollment.totalLessons || 1)) * 100),
    lessonsCompleted: enrollment.completedLessons,
    totalLessons: enrollment.totalLessons,
    studyTimeHours: enrollment.studyTimeHours || 0
  }));

  // 3. Weekly stats (mock: last 7 days)
  const weeklyStudyTime = studyTimeHours || 32; // You can calculate from real data later
  const weeklyLessonsDone = completedLessons || 18;
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyLessonsDone / 25) * 100));

  // 4. Recent achievements (mock)
  const recentAchievements = [
    { title: 'Calculus Master', earned: '2 days ago' },
    { title: 'Study Streak', earned: '7 days consecutive learning' }
  ];

  // 5. Study goals
  const studyGoals = {
    daily: {
      current: 1.8,
      target: 2.0
    },
    weekly: {
      current: weeklyLessonsDone,
      target: 25
    }
  };

  // 6. Performance insights (mock)
  const performanceInsights = [
    'Your chemistry performance improved by 15% this week.',
    'Spend more time on biology to boost overall progress.'
  ];

  // 7. Next milestone
  const nextMilestone = 'Complete 3 more math lessons to unlock the advanced calculus module!';

  res.json({
    success: true,
     data:{
      overallProgress: {
        percent: overallProgressPercent,
        activeCourses,
        totalCourses
      },
      courseProgress,
      weeklyStats: {
        studyTime: weeklyStudyTime,
        lessonsDone: weeklyLessonsDone,
        goalPercent: weeklyGoalPercent
      },
      recentAchievements,
      studyGoals,
      performanceInsights,
      nextMilestone
    },
    message: 'Progress tracker data retrieved successfully'
  });
});