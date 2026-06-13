const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const networkRoutes = require('./routes/networkRoutes');
const supportRoutes = require('./routes/supportRoutes');

// Import middleware
const { sanitizeInput } = require('./middleware/sanitizer');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(sanitizeInput); // Apply input sanitization to all requests
app.use(requestLogger); // Apply request logging to all requests

// Test database connection
const pool = require('./config/database');
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('✗ Database connection failed:', err);
  } else {
    console.log('✓ Database connected at:', result.rows[0].now);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/support', supportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    errorCode: 'NOT_FOUND',
  });
});

// Centralized error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  ArchiNet Backend Server`);
  console.log(`  Running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`========================================\n`);
});

module.exports = app;
