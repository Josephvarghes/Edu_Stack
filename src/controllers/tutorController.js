// src/controllers/tutorController.js
import httpStatus from 'http-status';
import APIError from '~/utils/apiError.js';
import catchAsync from '~/utils/catchAsync.js';
import Course from '~/models/courseModel';
import Enrollment from '~/models/enrollmentModel';
import Review from '~/models/reviewModel';
import Earning from '~/models/earningModels';
import TutorStats from '~/models/tutorStatsModel';

/**
 * Get tutor dashboard data
 */
export const getTutorDashboardData = catchAsync(async (req, res) => {
  const tutorId = req.user.id;

  // Get courses
  const courses = await Course.find({ tutor: tutorId }).lean();
  const coursesUploaded = courses.length;

  // Get total students enrolled
  const enrollments = await Enrollment.find({ 
    courseId: { $in: courses.map(c => c._id) } 
  }).lean();
  const studentsEnrolled = enrollments.length;

  // Get average completion rate
  const completedLessons = enrollments.reduce((sum, e) => sum + (e.completedLessons || 0), 0);
  const totalLessons = enrollments.reduce((sum, e) => sum + (e.totalLessons || 0), 0);
  const averageCompletionRate = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  // Get average rating
  const reviews = await Review.find({ 
    courseId: { $in: courses.map(c => c._id) } 
  }).lean();
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 
    ? parseFloat((totalRating / reviews.length).toFixed(1)) 
    : 0;

  // Get earnings (mock for MVP)
  const earningsThisMonth = 4287.50;
  const studentReviews = reviews.length;

  // Recent courses (top 2)
  const recentCourses = courses.slice(0, 2).map(course => {
    const courseEnrollments = enrollments.filter(e => e.courseId.toString() === course._id.toString());
    const completionRate = courseEnrollments.length > 0
      ? Math.round((courseEnrollments.reduce((sum, e) => sum + (e.completedLessons || 0), 0) / 
                   courseEnrollments.reduce((sum, e) => sum + (e.totalLessons || 0), 0)) * 100)
      : 0;
    
    return {
      title: course.title,
      enrolled: courseEnrollments.length,
      completionRate,
      courseId: course._id
    };
  });

  // Recent student activity (mock)
  const recentActivity = [
    { student: 'Emma Johnson', action: 'Completed ‘Introduction to Limits’', time: '2h ago' },
    { student: 'Michael Chen', action: 'Enrolled in ‘Organic Chemistry Basics’', time: '4h ago' },
    { student: 'Sophie Davis', action: 'Left a 5-star review', time: '6h ago' }
  ];

  // Upcoming sessions (mock)
  const upcomingSessions = [
    {
      title: 'Calculus Problem Solving',
      time: 'Today 3:00 PM',
      students: 23,
      action: 'Join Session'
    }
  ];

  res.json({
    success: true,
     data:{
      greeting: `Hello ${req.user.fullName} 👋`,
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      stats: {
        coursesUploaded,
        studentsEnrolled,
        earningsThisMonth,
        averageCompletionRate,
        averageRating,
        studentReviews
      },
      quickActions: {
        uploadCourse: 'Add new content',
        analytics: 'View Insights'
      },
      recentCourses,
      recentActivity,
      monthlyEarnings: {
        total: earningsThisMonth,
        change: '+23%',
        breakdown: {
          courseSales: 3840,
          certificates: 447,
          liveSessions: 0.50
        }
      },
      upcomingSessions,
      performanceMetrics: {
        courseCompletion: 94,
        studentSatisfaction: 96,
        teachingHours: 127
      }
    },
    message: 'Tutor dashboard data retrieved successfully'
  });
});

/**
 * Get earnings data
 */
export const getEarningsData = catchAsync(async (req, res) => {
  const tutorId = req.user.id;

  // Mock earnings data (replace with real logic later)
  const totalEarnings = 4287.50;
  const availableBalance = 3240;
  const earningHistory = [
    { type: 'course_sale', amount: 49.00, time: '2h ago' },
    { type: 'certificate_fee', amount: 15.00, time: '5h ago' },
    { type: 'course_sale', amount: 79.00, time: '1 day ago' }
  ];

  res.json({
    success: true,
     data:{
      totalEarnings,
      change: '+23%',
      revenueBreakdown: {
        courseSales: { amount: 3840, percent: 89.6 },
        certificates: { amount: 447, percent: 10.4 },
        liveSessions: { amount: 0.50, percent: 0.01 }
      },
      availableBalance,
      earningHistory,
      monthlySummary: {
        courseSales: 47,
        certificates: 23
      },
      paymentMethods: {
        bankTransfer: '****1234',
        paypal: 'sarah.wilson@email.com'
      },
      taxInfo: {
        documentsReady: true,
        documentType: '1099'
      }
    },
    message: 'Earnings data retrieved successfully'
  });
});