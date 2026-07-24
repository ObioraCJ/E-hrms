const express = require('express');
const router = express.Router();
const {
  generatePayroll,
  getPayrolls,
  getPayrollById,
  updatePayroll,
  updatePayrollStatus,
  getMyPayslips,
  getMyPayslipById,
} = require('../controllers/payrollController');
const {
  generatePayrollValidator,
  updatePayrollValidator,
} = require('../validators/payrollValidators');
const { protect, authorize } = require('../middleware/auth');

// Employee self-service: view only finalized/paid payslips.
router.get('/my', protect, getMyPayslips);
router.get('/my/:id', protect, getMyPayslipById);

// HR/admin only - payroll involves sensitive salary data, so this is
// deliberately more restrictive than Employee/Department/Attendance
// (no department_manager access here at all).
router.post('/generate', protect, authorize('super_admin', 'hr_manager'), generatePayrollValidator, generatePayroll);
router.get('/', protect, authorize('super_admin', 'hr_manager'), getPayrolls);
router.get('/:id', protect, authorize('super_admin', 'hr_manager'), getPayrollById);
router.put('/:id', protect, authorize('super_admin', 'hr_manager'), updatePayrollValidator, updatePayroll);
router.put('/:id/status', protect, authorize('super_admin', 'hr_manager'), updatePayrollStatus);

module.exports = router;