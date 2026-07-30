const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getMyProfile,
  updateMyProfile,
  uploadMyProfilePicture,
  getOrgChart,
} = require('../controllers/employeeController');
const {
  createEmployeeValidator,
  updateEmployeeValidator,
} = require('../validators/employeeValidators');
const { protect, authorize } = require('../middleware/auth');
const uploadProfilePicture = require('../config/uploadProfilePicture');

// Every route here requires a logged-in user (protect), and most
// require admin/hr_manager privileges (authorize) - regular employees
// shouldn't be able to create, edit, or remove other employees' records.

// IMPORTANT: /me routes must come BEFORE /:id routes - otherwise
// Express matches "/employees/me" against the /:id pattern (treating
// "me" as if it were a MongoDB ID), which crashes getEmployeeById.
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.post('/me/picture', protect, uploadProfilePicture.single('picture'), uploadMyProfilePicture);
router.get('/org-chart', protect, getOrgChart);

router.post('/', protect, authorize('super_admin', 'hr_manager'), createEmployeeValidator, createEmployee);
router.get('/', protect, authorize('super_admin', 'hr_manager', 'department_manager'), getEmployees);
router.get('/:id', protect, authorize('super_admin', 'hr_manager', 'department_manager'), getEmployeeById);
router.put('/:id', protect, authorize('super_admin', 'hr_manager'), updateEmployeeValidator, updateEmployee);
router.delete('/:id', protect, authorize('super_admin'), deleteEmployee);

module.exports = router;