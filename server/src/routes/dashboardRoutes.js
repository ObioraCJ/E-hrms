const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// No role restriction beyond being logged in - every role sees the
// dashboard, though what they see there could later be tailored
// per-role (e.g. a plain employee might not need department counts).
router.get('/summary', protect, getSummary);

module.exports = router;