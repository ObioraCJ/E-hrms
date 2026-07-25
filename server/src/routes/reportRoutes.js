const express = require('express');
const router = express.Router();
const {
  employeeReport,
  departmentReport,
  attendanceReport,
  leaveReport,
  payrollReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/employees', protect, authorize('super_admin', 'hr_manager'), employeeReport);
router.get('/departments', protect, authorize('super_admin', 'hr_manager'), departmentReport);
router.get(
  '/attendance',
  protect,
  authorize('super_admin', 'hr_manager', 'department_manager'),
  attendanceReport
);
router.get('/leave', protect, authorize('super_admin', 'hr_manager', 'department_manager'), leaveReport);
router.get('/payroll', protect, authorize('super_admin', 'hr_manager'), payrollReport);

module.exports = router;