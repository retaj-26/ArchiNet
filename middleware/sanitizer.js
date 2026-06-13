/**
 * Input Sanitization Middleware
 * Prevents XSS, injection attacks, and other malicious input
 */

function sanitizeString(str) {
  if (typeof str !== 'string') {
    return str;
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return email;
  }

  return email.toLowerCase().trim();
}

function sanitizePhone(phone) {
  if (typeof phone !== 'string') {
    return phone;
  }

  // Remove all non-numeric characters
  return phone.replace(/\D/g, '');
}

function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (value !== null && typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Middleware to sanitize all request inputs
 */
function sanitizeInput(req, res, next) {
  // Sanitize query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize request body
  if (req.body && Object.keys(req.body).length > 0) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize URL parameters
  if (req.params && Object.keys(req.params).length > 0) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Validate input length
 */
function validateLength(input, maxLength, fieldName) {
  if (typeof input !== 'string') {
    return true;
  }

  if (input.length > maxLength) {
    throw new Error(`${fieldName} يجب أن لا يتجاوز ${maxLength} حرف`);
  }

  return true;
}

/**
 * Validate required fields
 */
function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${fieldName} مطلوب`);
  }

  return true;
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new Error('البريد الإلكتروني غير صحيح');
  }

  return true;
}

/**
 * Validate phone number format
 */
function validatePhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  
  if (!phoneRegex.test(phone)) {
    throw new Error('رقم الهاتف غير صحيح');
  }

  return true;
}

/**
 * Validate URL
 */
function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    throw new Error('رابط غير صحيح');
  }
}

/**
 * Prevent NoSQL injection patterns
 */
function sanitizeForDatabase(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      // Skip operators (NoSQL injection prevention)
      if (key.startsWith('$')) {
        continue;
      }

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = sanitizeForDatabase(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'object' ? sanitizeForDatabase(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeObject,
  sanitizeInput,
  sanitizeForDatabase,
  validateLength,
  validateRequired,
  validateEmail,
  validatePhone,
  validateURL,
};
