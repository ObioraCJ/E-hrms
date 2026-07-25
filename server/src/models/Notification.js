const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // One row per recipient. A broadcast announcement to 50 people
    // creates 50 rows, not 1 - this keeps "mark as read" simple and
    // per-user, rather than needing a separate read-tracking table.
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: [
        'leave_approved',
        'leave_rejected',
        'payroll_generated',
        'new_employee',
        'birthday',
        'announcement',
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    // Optional frontend route to navigate to when this notification is
    // clicked, e.g. "/my-leave" for a leave_approved notification.
    link: {
      type: String,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    // Null for system-generated notifications (leave review, payroll,
    // birthday reminders). Set only for manually-created announcements,
    // so we know which HR/admin user actually posted it.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Notifications are almost always queried "give me this user's latest
// notifications" - this index makes that lookup fast even as the
// collection grows large over time.
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);