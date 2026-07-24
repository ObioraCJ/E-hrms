const { body } = require('express-validator');

exports.applyLeaveValidator = [
  body('leaveType')
    .isIn(['annual', 'sick', 'casual', 'maternity', 'paternity'])
    .withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('A valid start date is required'),
  body('endDate').isISO8601().withMessage('A valid end date is required'),
  body('reason').optional().trim(),
];

exports.reviewLeaveValidator = [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reviewNote').optional().trim(),
];