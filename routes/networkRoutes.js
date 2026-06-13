const express = require('express');
const router = express.Router();
const {
  submitAnalysisRequest,
  submitNetworkRequest,
  getAllNetworkRequests,
  getNetworkRequestById,
  updateNetworkRequestStatus,
} = require('../controllers/networkController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Public routes
router.post('/requests', submitNetworkRequest);
router.post('/analysis', submitAnalysisRequest);

// Protected routes (authentication required)
router.get('/requests/:id', authenticateToken, getNetworkRequestById);

// Admin routes (admin role required)
router.get('/requests', authenticateToken, authorize('admin', 'analyst'), getAllNetworkRequests);
router.patch('/requests/:id/status', authenticateToken, authorize('admin', 'analyst'), updateNetworkRequestStatus);

module.exports = router;
