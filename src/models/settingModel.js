import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    unique: true
  },
  notifications: {
    classReminders: { type: Boolean, default: true },
    assignmentDeadlines: { type: Boolean, default: true },
    tutorMessages: { type: Boolean, default: true },
    progressUpdates: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

export default mongoose.model('Setting', settingSchema);