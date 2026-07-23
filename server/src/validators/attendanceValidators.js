const { body } = require('express-validator');

exports.createAttendanceValidator = [
  body('employee').isMongoId().withMessage('A valid employee is required'),
  body('date').isISO8601().withMessage('A valid date is required'),
  body('clockIn').notEmpty().withMessage('Clock-in time is required'),
  body('clockOut').optional({ nullable: true }),
  body('breakMinutes').optional().isInt({ min: 0 }).withMessage('Break minutes must be a positive number'),
  body('status').optional().isIn(['present', 'late', 'half-day', 'absent']),
];

exports.updateAttendanceValidator = [
  body('clockIn').optional().notEmpty(),
  body('clockOut').optional({ nullable: true }),
  body('breakMinutes').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['present', 'late', 'half-day', 'absent']),
];