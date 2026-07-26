const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date, required: true },
    mode: {
      type: String,
      enum: ['in-person', 'virtual', 'phone'],
      default: 'virtual',
    },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: { type: String, trim: true },
    outcome: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending',
    },
  },
  { _id: true, timestamps: true }
);

const applicationSchema = new mongoose.Schema(
  {
    vacancy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobVacancy',
      required: true,
    },

    // Candidates are NOT system users - they don't log in, so their
    // info is captured directly here rather than referencing a User.
    candidateName: { type: String, required: true, trim: true },
    candidateEmail: { type: String, required: true, trim: true, lowercase: true },
    candidatePhone: { type: String, trim: true },

    coverLetter: { type: String, trim: true },

    // Path on disk where multer saved the uploaded resume file -
    // never the raw file content itself, which would bloat the
    // database; the actual bytes live in the filesystem.
    resumePath: { type: String, required: true },
    resumeOriginalName: { type: String }, // the candidate's original filename, for display

    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'],
      default: 'applied',
    },

    interviews: [interviewSchema],

    offer: {
      position: { type: String, trim: true },
      salary: { type: Number, min: 0 },
      startDate: { type: Date },
      sentAt: { type: Date, default: null },
      sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },

    internalNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);