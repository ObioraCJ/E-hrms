const express = require('express');
const router = express.Router();
const {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  acknowledgeReview,
  getMyReviews,
  getMyReviewById,
} = require('../controllers/performanceController');
const {
  createReviewValidator,
  updateReviewValidator,
} = require('../validators/performanceValidators');
const { protect, authorize } = require('../middleware/auth');

// Employee self-service: view own reviews (only once submitted), acknowledge them.
router.get('/my', protect, getMyReviews);
router.get('/my/:id', protect, getMyReviewById);
router.put('/:id/acknowledge', protect, acknowledgeReview);

// HR/managers create and manage reviews. department_manager included
// here since they're the ones actually conducting most reviews day to
// day, per your spec ("Department Manager: Evaluate employee performance").
router.post(
  '/',
  protect,
  authorize('super_admin', 'hr_manager', 'department_manager'),
  createReviewValidator,
  createReview
);
router.get(
  '/',
  protect,
  authorize('super_admin', 'hr_manager', 'department_manager'),
  getReviews
);
router.get(
  '/:id',
  protect,
  authorize('super_admin', 'hr_manager', 'department_manager'),
  getReviewById
);
router.put(
  '/:id',
  protect,
  authorize('super_admin', 'hr_manager', 'department_manager'),
  updateReviewValidator,
  updateReview
);

module.exports = router;