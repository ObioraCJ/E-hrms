const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const {
  getPublicVacancies,
  getPublicVacancyById,
  applyToVacancy,
  createVacancy,
  getAllVacancies,
  updateVacancy,
  getApplications,
  getApplicationById,
  downloadResume,
  updateApplicationStatus,
  scheduleInterview,
  sendOffer,
} = require('../controllers/recruitmentController');
const {
  createVacancyValidator,
  applyValidator,
  scheduleInterviewValidator,
  sendOfferValidator,
} = require('../validators/recruitmentValidators');
const { protect, authorize } = require('../middleware/auth');

// ---- PUBLIC ROUTES - no protect middleware at all ----
router.get('/public/vacancies', getPublicVacancies);
router.get('/public/vacancies/:id', getPublicVacancyById);
router.post('/public/vacancies/:id/apply', upload.single('resume'), applyValidator, applyToVacancy);

// ---- ADMIN ROUTES - protected ----
router.post('/vacancies', protect, authorize('super_admin', 'hr_manager'), createVacancyValidator, createVacancy);
router.get('/vacancies', protect, authorize('super_admin', 'hr_manager'), getAllVacancies);
router.put('/vacancies/:id', protect, authorize('super_admin', 'hr_manager'), updateVacancy);

router.get('/applications', protect, authorize('super_admin', 'hr_manager'), getApplications);
router.get('/applications/:id', protect, authorize('super_admin', 'hr_manager'), getApplicationById);
router.get('/applications/:id/resume', protect, authorize('super_admin', 'hr_manager'), downloadResume);
router.put('/applications/:id/status', protect, authorize('super_admin', 'hr_manager'), updateApplicationStatus);
router.post(
  '/applications/:id/interviews',
  protect,
  authorize('super_admin', 'hr_manager'),
  scheduleInterviewValidator,
  scheduleInterview
);
router.post(
  '/applications/:id/offer',
  protect,
  authorize('super_admin', 'hr_manager'),
  sendOfferValidator,
  sendOffer
);

module.exports = router;