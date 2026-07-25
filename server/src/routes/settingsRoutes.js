const express = require('express');
const router = express.Router();
const {
  getSettingsData,
  updateSettings,
  addHoliday,
  deleteHoliday,
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// Anyone logged in can VIEW settings (e.g. an employee might want to
// see the holiday list), but only super_admin can change them - this
// is company-wide configuration, more sensitive than day-to-day HR ops.
router.get('/', protect, getSettingsData);
router.put('/', protect, authorize('super_admin'), updateSettings);
router.post('/holidays', protect, authorize('super_admin'), addHoliday);
router.delete('/holidays/:holidayId', protect, authorize('super_admin'), deleteHoliday);

module.exports = router;