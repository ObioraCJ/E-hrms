const { body } = require('express-validator');

exports.createDepartmentValidator = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('description').optional().trim(),
  body('manager').optional().isMongoId().withMessage('Manager must be a valid employee ID'),
];

exports.updateDepartmentValidator = [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('manager').optional({ nullable: true }).isMongoId().withMessage('Manager must be a valid employee ID'),
];