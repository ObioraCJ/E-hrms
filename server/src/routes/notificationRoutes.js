const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createAnnouncement,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

// Every logged-in user manages their own notifications.
router.get('/my', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);

// Only HR/admin can broadcast a company-wide announcement.
router.post('/announcement', protect, authorize('super_admin', 'hr_manager'), createAnnouncement);

module.exports = router;