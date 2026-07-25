const { body } = require('express-validator');

exports.createReviewValidator = [
  body('employee').isMongoId().withMessage('A valid employee is required'),
  body('reviewPeriod').trim().notEmpty().withMessage('Review period is required'),
  body('kpis').optional().isArray(),
  body('kpis.*.name').if(body('kpis').exists()).notEmpty().withMessage('Each KPI needs a name'),
  body('kpis.*.rating').optional().isInt({ min: 1, max: 5 }),
  body('goals').optional().isArray(),
  body('goals.*.title').if(body('goals').exists()).notEmpty().withMessage('Each goal needs a title'),
  body('managerFeedback').optional().trim(),
  body('overallRating').optional().isInt({ min: 1, max: 5 }),
];

exports.updateReviewValidator = [
  body('kpis').optional().isArray(),
  body('goals').optional().isArray(),
  body('managerFeedback').optional().trim(),
  body('overallRating').optional().isInt({ min: 1, max: 5 }),
  body('status').optional().isIn(['draft', 'submitted']),
];