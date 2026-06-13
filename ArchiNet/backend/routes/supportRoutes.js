const express = require('express');
const router = express.Router();
const {
  submitSupportTicket,
  getAllSupportTickets,
  getSupportTicketById,
  updateSupportTicket,
} = require('../controllers/supportController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Public routes
router.post('/tickets', submitSupportTicket);

// Protected routes (users can see their own tickets)
router.get('/tickets/:id', authenticateToken, getSupportTicketById);

// Admin routes (admin/support can manage all tickets)
router.get('/tickets', authenticateToken, authorize('admin', 'support'), getAllSupportTickets);
router.patch('/tickets/:id', authenticateToken, authorize('admin', 'support'), updateSupportTicket);

module.exports = router;
