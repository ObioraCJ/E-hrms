const express = require('express');
const router = express.Router();
const {
  createAttendance,
  getAttendance,
  getMyAttendance,
  updateAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');
const {
  createAttendanceValidator,
  updateAttendanceValidator,
} = require('../validators/attendanceValidators');
const { protect, authorize } = require('../middleware/auth');

// Employees can only view their OWN attendance history - read-only,
// no self-service clock-in/out anymore.
router.get('/my', protect, getMyAttendance);

// Everything below is HR/management entering and correcting records
// sourced from the physical thumbprint device.
router.post('/', protect, authorize('super_admin', 'hr_manager'), createAttendanceValidator, createAttendance);
router.get('/', protect, authorize('super_admin', 'hr_manager', 'department_manager'), getAttendance);
router.put('/:id', protect, authorize('super_admin', 'hr_manager'), updateAttendanceValidator, updateAttendance);
router.delete('/:id', protect, authorize('super_admin'), deleteAttendance);

module.exports = router;