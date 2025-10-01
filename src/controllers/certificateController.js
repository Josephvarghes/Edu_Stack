import Certificate from '~/models/certificateModel.js';
import httpStatus from 'http-status';
import APIError from '~/utils/apiError.js';
import catchAsync from '~/utils/catchAsync.js';
import User from '~/models/userModel';
import Course from '~/models/courseModel';
import Quiz from '~/models/quizModel'; 
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';

/**
 * Get certificate by ID (for detail screen)
 */
export const getCertificateById = catchAsync(async (req, res) => {
  const { certificateId } = req.params;

  // Fetch certificate with populated data
  const certificate = await Certificate.findById(certificateId)
    .populate('userId', 'fullName')
    .populate('courseId', 'title tutor')
    .populate('quizId', 'title')
    .lean();

  if (!certificate) {
    return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        data: null,
        message: 'Certificate not found'
      });
  } 
   

  // Fetch instructor name from course
  let instructorName = 'Instructor';
  if (certificate.courseId?.tutor) {
    const instructor = await User.findById(certificate.courseId.tutor).lean();
    instructorName = instructor?.fullName || 'Instructor';
  }

  // Determine achievement level based on score
  let achievementLevel = 'Bronze';
  if (certificate.score >= 90) achievementLevel = 'Platinum';
  else if (certificate.score >= 80) achievementLevel = 'Gold';
  else if (certificate.score >= 70) achievementLevel = 'Silver';

  // Format certificate ID
  const certificateIdFormatted = `CERT-${new Date(certificate.completionDate).getFullYear()}-${certificate.subject.substring(0, 3).toUpperCase()}-${certificate.userId?.toString().substring(0, 2).toUpperCase()}-${certificate._id.toString().substring(0, 3).toUpperCase()}`;

  res.json({
    success: true,
    data: {
      certificateId: certificateIdFormatted,
      recipientName: certificate.userId?.fullName || 'Learner',
      courseTitle: certificate.courseId?.title || certificate.title,
      quizTitle: certificate.quizId?.title || certificate.title,
      instructorName,
      completionDate: certificate.completionDate,
      score: certificate.score,
      achievementLevel,
      verificationCode: certificate.verificationCode,
      skillsEarned: certificate.skillsEarned || [],
      studyTimeHours: certificate.studyTimeHours,
      chaptersCompleted: certificate.chaptersCompleted,
      quizzesPassed: certificate.quizzesPassed,
      isPublic: certificate.isPublic,
      shareUrl: certificate.shareUrl
    },
    message: 'Certificate details retrieved successfully'
  });
});


export const downloadCertificate = catchAsync(async (req, res) => {
  const { certificateId } = req.params;

  const certificate = await Certificate.findById(certificateId)
    .populate('userId', 'fullName')
    .populate('courseId', 'title tutor')
    .populate('quizId', 'title')
    .lean();

  if (!certificate) {
    throw new APIError('Certificate not found', httpStatus.NOT_FOUND);
  }

  let instructorName = 'Instructor';
  if (certificate.courseId?.tutor) {
    const instructor = await User.findById(certificate.courseId.tutor).lean();
    instructorName = instructor?.fullName || 'Instructor';
  }

  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]); // A4 size

  // Load fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Define colors
  const blue = rgb(0.1, 0.3, 0.8); // #1A4FCC
  const gray = rgb(0.7, 0.7, 0.7);

// // Draw blue circular background
//   page.drawCircle({
//     x: 300,
//     y: 700,
//     size: 20,
//     color: rgb(0.1, 0.3, 0.8), // #1A4FCC
//     borderColor: rgb(1, 1, 1),
//     borderWidth: 2
//   });

// Draw white asterisk (star-like) inside circle
  page.drawText('', {
    x: 295,
    y: 690,
    size: 36,
    font: helveticaBold,
    color: rgb(1, 1, 1)
  });

  // Add title
  page.drawText('Certificate of Achievement', {
    x: 150,
    y: 660,
    size: 24,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });

  // Add subtitle
  page.drawText('This is to certify that', {
    x: 240,
    y: 630,
    size: 12,
    font: helvetica,
    color: gray
  });

  // Add recipient name (large, blue)
  page.drawText(certificate.userId?.fullName || 'Learner', {
    x: 220,
    y: 570,
    size: 28,
    font: helveticaBold,
    color: blue
  });

  // Add "has successfully completed"
  page.drawText('has successfully completed', {
    x: 200,
    y: 530,
    size: 14,
    font: helvetica,
    color: rgb(0, 0, 0)
  });

  // Add course title (bold, large)
  page.drawText(certificate.courseId?.title || certificate.title, {
    x: 180,
    y: 500,
    size: 20,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });

  // Add instructor & date (side by side)
  page.drawText('Instructor', {
    x: 100,
    y: 470,
    size: 10,
    font: helvetica,
    color: gray
  });
  page.drawText(instructorName, {
    x: 100,
    y: 455,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });

  page.drawText('Date', {
    x: 300,
    y: 470,
    size: 10,
    font: helvetica,
    color: gray
  });
  page.drawText(new Date(certificate.completionDate).toLocaleDateString(), {
    x: 300,
    y: 455,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });

  // Add horizontal line
  page.drawLine({
    start: { x: 100, y: 440 },
    end: { x: 500, y: 440 },
    thickness: 1,
    color: gray
  });

  // Add certificate ID
  page.drawText(`Certificate ID: ${certificate.verificationCode}`, {
    x: 100,
    y: 420,
    size: 10,
    font: helvetica,
    color: gray
  });

  // Add final score
  page.drawText(`Final Score: ${certificate.score}% — ${getAchievementLevel(certificate.score)} Performance`, {
    x: 100,
    y: 400,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });

  // Serialize PDF
  const pdfBytes = await pdfDoc.save();

  // Set headers for download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Certificate_${certificate.courseId?.title.replace(/\s+/g, '_')}_${certificate.userId?.fullName.replace(/\s+/g, '_')}.pdf"`);

  // Send PDF as binary stream
  res.end(pdfBytes);
});

function getAchievementLevel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  return 'Pass';
}


/**
 * Get all certificates for a user (for "My Certificates" screen)
 */
export const getCertificatesByUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { subject } = req.query;

  // Authorization: only allow users to view their own certificates
  // OR allow admins to view any user's certificates
  if (req.user.id !== userId && req.user.role !== 'admin') {
    throw new APIError('Not authorized to view these certificates', httpStatus.FORBIDDEN);
  }

  // Build filter
  let filter = { userId };
  if (subject) {
    filter.subject = subject;
  }

  // Fetch certificates
  const certificates = await Certificate.find(filter)
    .sort({ completionDate: -1 }) // newest first
    .lean();

  // Enrich with achievement level and icon
  const enrichedCertificates = certificates.map(cert => {
    let achievementLevel = 'Bronze';
    let icon = 'trophy'; // default icon
    
    if (cert.score >= 90) {
      achievementLevel = 'Platinum';
      icon = 'crown';
    } else if (cert.score >= 80) {
      achievementLevel = 'Gold';
      icon = 'star';
    } else if (cert.score >= 70) {
      achievementLevel = 'Silver';
      icon = 'star';
    }

    return {
      id: cert._id,
      subject: cert.subject,
      title: cert.title,
      completionDate: cert.completionDate,
      score: cert.score,
      achievementLevel,
      icon,
      verificationCode: cert.verificationCode,
      isPublic: cert.isPublic,
      shareUrl: cert.shareUrl
    };
  });

  res.json({
    success: true,
    data: {
      certificates: enrichedCertificates,
      total: enrichedCertificates.length,
      subjectFilter: subject || 'All'
    },
    message: 'Certificates retrieved successfully'
  });
});