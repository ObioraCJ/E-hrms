const { body } = require('express-validator');

// Rules for creating a new employee. Since this endpoint creates BOTH
// a User (login credentials) and an Employee (HR profile) at once, it
// validates fields for both.
exports.createEmployeeValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'hr_manager', 'employee'])
    .withMessage('Role must be admin, hr_manager, or employee'),

  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('dateOfJoining').isISO8601().withMessage('A valid date of joining is required'),

  body('gender').optional().isIn(['male', 'female', 'other']),
  body('employmentType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'intern']),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
];

// Rules for updating an existing employee. Notice there's no email or
// password here - credential changes should go through dedicated
// auth endpoints, not the general employee-update endpoint, to keep
// security-sensitive actions isolated and separately auditable.
exports.updateEmployeeValidator = [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('department').optional().trim().notEmpty(),
  body('designation').optional().trim().notEmpty(),
  body('dateOfJoining').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('employmentType').optional().isIn(['full-time', 'part-time', 'contract', 'intern']),
  body('status').optional().isIn(['active', 'on-leave', 'terminated']),
  body('salary').optional().isFloat({ min: 0 }),
];