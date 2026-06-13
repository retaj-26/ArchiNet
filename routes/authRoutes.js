const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/sanitizer');

/**
 * Public Routes
 */

// User Registration
router.post('/register', sanitizeInput, register);

// User Login
router.post('/login', sanitizeInput, login);

/**
 * Protected Routes
 */

// Get Current User
router.get('/me', authenticateToken, getCurrentUser);

// Update User Profile
router.patch('/profile', authenticateToken, sanitizeInput, updateProfile);

// Change Password
router.post('/change-password', authenticateToken, sanitizeInput, changePassword);

// Refresh Token
router.post('/refresh-token', refreshToken);

// Logout
router.post('/logout', authenticateToken, sanitizeInput, logout);

module.exports = router;
