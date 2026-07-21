const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const {
  createEmployeeValidator,
  updateEmployeeValidator,
} = require('../validators/employeeValidators');
const { protect, authorize } = require('../middleware/auth');

// Every route here requires a logged-in user (protect), and most
// require admin/hr_manager privileges (authorize) - regular employees
// shouldn't be able to create, edit, or remove other employees' records.

router.post('/', protect, authorize('super_admin', 'hr_manager'), createEmployeeValidator, createEmployee);
router.get('/', protect, authorize('super_admin', 'hr_manager', 'department_manager'), getEmployees);
router.get('/:id', protect, authorize('super_admin', 'hr_manager', 'department_manager'), getEmployeeById);
router.put('/:id', protect, authorize('super_admin', 'hr_manager'), updateEmployeeValidator, updateEmployee);
router.delete('/:id', protect, authorize('super_admin'), deleteEmployee);

module.exports = router;