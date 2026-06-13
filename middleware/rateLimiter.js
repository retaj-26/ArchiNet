/**
 * Rate Limiting Middleware
 * Uses in-memory store (for production, use Redis)
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = 60000; // Cleanup every minute
    this.startCleanup();
  }

  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        // Remove entries older than 15 minutes
        if (now - data.firstRequest > 15 * 60 * 1000) {
          this.requests.delete(key);
        }
      }
    }, this.cleanupInterval);
  }

  getKey(req, identifier = 'ip') {
    if (identifier === 'ip') {
      return req.ip || req.connection.remoteAddress;
    }
    if (identifier === 'user') {
      return req.user?.userId || req.ip;
    }
    return identifier;
  }

  isRateLimited(key, limit, windowMs) {
    const now = Date.now();
    const data = this.requests.get(key) || { count: 0, firstRequest: now };

    // If window expired, reset
    if (now - data.firstRequest > windowMs) {
      this.requests.set(key, { count: 1, firstRequest: now });
      return false;
    }

    // Check if over limit
    if (data.count >= limit) {
      return true;
    }

    // Increment counter
    data.count += 1;
    this.requests.set(key, data);
    return false;
  }
}

const limiter = new RateLimiter();

/**
 * Generic rate limit middleware
 */
function createRateLimiter(options = {}) {
  const {
    limit = 100,
    windowMs = 15 * 60 * 1000, // 15 minutes
    identifier = 'ip',
    message = 'عدد الطلبات كثير جداً، يرجى المحاولة لاحقاً',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return (req, res, next) => {
    // Allow admins to bypass rate limiting
    if (req.user?.role === 'admin') {
      return next();
    }

    const key = limiter.getKey(req, identifier);

    // Check if rate limited
    if (limiter.isRateLimited(key, limit, windowMs)) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    next();
  };
}

/**
 * Predefined rate limiters
 */

// General API rate limiter
const apiLimiter = createRateLimiter({
  limit: 100,
  windowMs: 15 * 60 * 1000,
  identifier: 'ip',
  message: 'عدد طلبات API كثير جداً',
});

// Authentication attempts limiter
const authLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000,
  identifier: 'ip',
  message: 'محاولات تسجيل الدخول كثيرة جداً، يرجى المحاولة بعد 15 دقيقة',
});

// File upload limiter
const uploadLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  identifier: 'user',
  message: 'لقد تجاوزت حد تحميل الملفات المسموح به',
});

// Form submission limiter
const formLimiter = createRateLimiter({
  limit: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
  identifier: 'user',
  message: 'عدد الطلبات كثير جداً، يرجى المحاولة لاحقاً',
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  uploadLimiter,
  formLimiter,
};
