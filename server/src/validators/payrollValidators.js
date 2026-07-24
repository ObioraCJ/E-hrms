const { body } = require('express-validator');

exports.generatePayrollValidator = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000 }).withMessage('A valid year is required'),
];

exports.updatePayrollValidator = [
  body('allowances').optional().isFloat({ min: 0 }),
  body('overtimeHours').optional().isFloat({ min: 0 }),
  body('overtimeRate').optional().isFloat({ min: 0 }),
  body('bonuses').optional().isFloat({ min: 0 }),
  body('tax').optional().isFloat({ min: 0 }),
  body('pension').optional().isFloat({ min: 0 }),
  body('otherDeductions').optional().isFloat({ min: 0 }),
];