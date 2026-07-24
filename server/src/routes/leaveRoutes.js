const express = require('express');
const router = express.Router();
const {
  applyLeave,
  cancelLeave,
  getMyLeaves,
  getMyBalance,
  getAllLeaves,
  reviewLeave,
} = require('../controllers/leaveController');
const {
  applyLeaveValidator,
  reviewLeaveValidator,
} = require('../validators/leaveValidators');
const { protect, authorize } = require('../middleware/auth');

// Any logged-in employee manages their own leave requests.
router.post('/', protect, applyLeaveValidator, applyLeave);
router.put('/:id/cancel', protect, cancelLeave);
router.get('/my', protect, getMyLeaves);
router.get('/my/balance', protect, getMyBalance);

// HR/managers review everyone's requests.
router.get('/', protect, authorize('super_admin', 'hr_manager', 'department_manager'), getAllLeaves);
router.put(
  '/:id/review',
  protect,
  authorize('super_admin', 'hr_manager', 'department_manager'),
  reviewLeaveValidator,
  reviewLeave
);

module.exports = router;