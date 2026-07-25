const Notification = require('../models/Notification');

// Central helper for creating a single notification. Every other
// controller (leave, payroll, employee) calls this instead of touching
// the Notification model directly - keeps the creation logic in one
// place, and makes it trivial to add things later (e.g. sending an
// actual email alongside the in-app notification) without hunting
// through multiple controllers.
const createNotification = async ({ recipient, type, title, message, link = null, createdBy = null }) => {
  try {
    return await Notification.create({ recipient, type, title, message, link, createdBy });
  } catch (err) {
    // Notifications are a "nice to have" side effect - if creating one
    // fails for some reason, we log it but deliberately don't throw.
    // A failed notification should never cause the actual action (e.g.
    // approving leave) to fail or roll back.
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

// Convenience wrapper for sending the SAME notification to many
// recipients at once (e.g. a company-wide announcement, or notifying
// every HR user about a new employee).
const createNotificationForMany = async ({ recipients, type, title, message, link = null, createdBy = null }) => {
  const docs = recipients.map((recipient) => ({
    recipient,
    type,
    title,
    message,
    link,
    createdBy,
  }));
  try {
    return await Notification.insertMany(docs);
  } catch (err) {
    console.error('Failed to create bulk notifications:', err.message);
    return [];
  }
};

module.exports = { createNotification, createNotificationForMany };