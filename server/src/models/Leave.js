const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'maternity', 'paternity'],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },

    // Stored rather than recalculated on every read, so a later change
    // to how "number of days" is counted (e.g. excluding weekends)
    // doesn't silently alter the day-count on already-approved leave.
    numberOfDays: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },

    // Who approved/rejected this request, and when - an audit trail,
    // separate from who applied for it (that's the `employee` field).
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', leaveSchema);