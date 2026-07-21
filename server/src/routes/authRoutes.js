const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, getMe } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidators');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', protect, authorize('super_admin'), registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;