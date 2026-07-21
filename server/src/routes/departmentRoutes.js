const express = require('express');
const router = express.Router();
const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const {
  createDepartmentValidator,
  updateDepartmentValidator,
} = require('../validators/departmentValidators');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('super_admin', 'hr_manager'), createDepartmentValidator, createDepartment);
router.get('/', protect, authorize('super_admin', 'hr_manager', 'department_manager'), getDepartments);
router.get('/:id', protect, authorize('super_admin', 'hr_manager', 'department_manager'), getDepartmentById);
router.put('/:id', protect, authorize('super_admin', 'hr_manager'), updateDepartmentValidator, updateDepartment);
router.delete('/:id', protect, authorize('super_admin'), deleteDepartment);

module.exports = router;