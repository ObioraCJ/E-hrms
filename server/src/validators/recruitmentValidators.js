const { body } = require('express-validator');

exports.createVacancyValidator = [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('employmentType').optional().isIn(['full-time', 'part-time', 'contract', 'intern']),
];

exports.applyValidator = [
  body('candidateName').trim().notEmpty().withMessage('Name is required'),
  body('candidateEmail').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('candidatePhone').optional().trim(),
  body('coverLetter').optional().trim(),
];

exports.scheduleInterviewValidator = [
  body('scheduledAt').isISO8601().withMessage('A valid interview date/time is required'),
  body('mode').optional().isIn(['in-person', 'virtual', 'phone']),
  body('interviewer').optional().isMongoId(),
];

exports.sendOfferValidator = [
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('salary').isFloat({ min: 0 }).withMessage('A valid salary is required'),
  body('startDate').isISO8601().withMessage('A valid start date is required'),
];