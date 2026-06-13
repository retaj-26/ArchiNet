const fs = require('fs');
const path = require('path');

/**
 * Logging Utility
 * Handles request logs, error logs, and debug logs
 */

const logsDir = path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log levels
 */
const LogLevels = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

/**
 * Get color for console output
 */
function getColorCode(level) {
  const colors = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m',  // Green
    WARN: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m', // Red
  };
  return colors[level] || '';
}

const RESET = '\x1b[0m';

/**
 * Write log to file
 */
function writeLogFile(filename, message) {
  const filepath = path.join(logsDir, filename);
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;

  try {
    fs.appendFileSync(filepath, logEntry, { encoding: 'utf-8' });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Log file write failed:', err.message);
    }
  }
}

/**
 * Logger class
 */
class Logger {
  constructor(module = 'APP') {
    this.module = module;
  }

  log(level, message, data = null) {
    const color = getColorCode(level);
    const timestamp = new Date().toISOString();
    const prefix = `${color}[${timestamp}] [${level}] [${this.module}]${RESET}`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${prefix} ${message}`, data ? data : '');
    }

    // Write to appropriate log file
    let filename = 'app.log';
    if (level === 'ERROR') {
      filename = 'error.log';
    } else if (level === 'DEBUG') {
      filename = 'debug.log';
    }

    const logMessage = `[${level}] [${this.module}] ${message} ${data ? JSON.stringify(data) : ''}`;
    writeLogFile(filename, logMessage);
  }

  debug(message, data = null) {
    this.log(LogLevels.DEBUG, message, data);
  }

  info(message, data = null) {
    this.log(LogLevels.INFO, message, data);
  }

  warn(message, data = null) {
    this.log(LogLevels.WARN, message, data);
  }

  error(message, data = null) {
    this.log(LogLevels.ERROR, message, data);
  }
}

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const logger = new Logger('HTTP');
  const startTime = Date.now();

  // Log incoming request
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId || 'anonymous',
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    
    // Log outgoing response
    logger.info(`${req.method} ${req.path} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      userId: req.user?.userId || 'anonymous',
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Create logger for specific modules
 */
function getLogger(moduleName = 'APP') {
  return new Logger(moduleName);
}

/**
 * Log API usage statistics
 */
async function logAPIUsage(req, statusCode, responseTime, pool) {
  try {
    if (!pool) return;

    const query = `
      INSERT INTO api_usage (user_id, endpoint, method, status_code, response_time_ms, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await pool.query(query, [
      req.user?.userId || null,
      req.path,
      req.method,
      statusCode,
      responseTime,
      req.ip,
    ]);
  } catch (error) {
    const logger = getLogger('APIUsage');
    logger.error('Failed to log API usage', { error: error.message });
  }
}

module.exports = {
  Logger,
  LogLevels,
  getLogger,
  requestLogger,
  logAPIUsage,
};
