// src/controllers/noteController.js
import httpStatus from 'http-status';
import APIError from '~/utils/apiError.js';
import catchAsync from '~/utils/catchAsync.js';
import Note from '~/models/noteModel';
import Course from '~/models/courseModel'; 
import Lesson from '~/models/lessonModel';

/**
 * Create a new note
 */
export const createNote = catchAsync(async (req, res) => {
  const { courseId, lessonId, content, tag, isPublic = false } = req.body;
  const userId = req.user.id;

  // Verify course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        data: null,
        message: 'Course not found'
      });
  }
  
  if (lessonId) {
    const lesson = await Lesson.findOne({ _id: lessonId, courseId: courseId });
    if (!lesson) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        data: null,
        message: 'Lesson not found'
      });
    }
   }
  const note = await Note.create({
    userId,
    courseId,
    lessonId,
    content,
    tag,
    isPublic
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    data:{note},
    message: 'Note created successfully'
  });
});

/**
 * Get all notes for a user (My Notes)
 */
export const getNotesByUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  // Authorization: only allow user to view their own notes
  if (req.user.id !== userId && req.user.role !== 'admin') {
    throw new APIError('Not authorized to view these notes', httpStatus.FORBIDDEN);
  }

  const notes = await Note.find({ userId })
    .populate('courseId', 'title')
    .populate('lessonId', 'title')
    .sort({ timestamp: -1 })
    .lean();

  res.json({
    success: true,
     data:{notes},
    message: 'Notes retrieved successfully'
  });
});

/**
 * Get all public notes for a course (Discussion Tab)
 */
export const getNotesByCourse = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const notes = await Note.find({ courseId, isPublic: true })
    .populate('userId', 'fullName')
    .populate('lessonId', 'title')
    .sort({ timestamp: -1 })
    .lean();

  res.json({
    success: true,
    data:{notes},
    message: 'Course notes retrieved successfully'
  });
});

/**
 * Update a note
 */
export const updateNote = catchAsync(async (req, res) => {
  const { noteId } = req.params;
  const { content, tag, isPublic } = req.body;
  const userId = req.user.id;

  const note = await Note.findById(noteId);
  if (!note) {
    throw new APIError('Note not found', httpStatus.NOT_FOUND);
  }

  // Authorization: only allow user to edit their own notes
  if (note.userId.toString() !== userId) {
    throw new APIError('Not authorized to update this note', httpStatus.FORBIDDEN);
  }

  Object.assign(note, { content, tag, isPublic });
  await note.save();

  res.json({
    success: true,
     note,
    message: 'Note updated successfully'
  });
});

/**
 * Delete a note
 */
export const deleteNote = catchAsync(async (req, res) => {
  const { noteId } = req.params;
  const userId = req.user.id;

  const note = await Note.findById(noteId);
  if (!note) {
    throw new APIError('Note not found', httpStatus.NOT_FOUND);
  }

  // Authorization: only allow user to delete their own notes
  if (note.userId.toString() !== userId) {
    throw new APIError('Not authorized to delete this note', httpStatus.FORBIDDEN);
  }

  await note.deleteOne();

  res.json({
    success: true,
     data:{},
    message: 'Note deleted successfully'
  });
});