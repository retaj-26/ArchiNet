/**
 * Centralized Error Handler Middleware
 * All errors should be passed to next(error)
 */

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
const ErrorTypes = {
  VALIDATION_ERROR: {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'بيانات غير صحيحة',
  },
  NOT_FOUND: {
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'لم يتم العثور على المورد',
  },
  UNAUTHORIZED: {
    statusCode: 401,
    code: 'UNAUTHORIZED',
    message: 'لم يتم المصادقة',
  },
  FORBIDDEN: {
    statusCode: 403,
    code: 'FORBIDDEN',
    message: 'لا تملك صلاحيات كافية',
  },
  DUPLICATE_ENTRY: {
    statusCode: 409,
    code: 'DUPLICATE_ENTRY',
    message: 'هذا السجل موجود بالفعل',
  },
  INTERNAL_ERROR: {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'خطأ داخلي في الخادم',
  },
  SERVICE_UNAVAILABLE: {
    statusCode: 503,
    code: 'SERVICE_UNAVAILABLE',
    message: 'الخدمة غير متاحة حالياً',
  },
  FILE_TOO_LARGE: {
    statusCode: 413,
    code: 'FILE_TOO_LARGE',
    message: 'الملف كبير جداً',
  },
  INVALID_FILE_TYPE: {
    statusCode: 400,
    code: 'INVALID_FILE_TYPE',
    message: 'نوع الملف غير مدعوم',
  },
};

/**
 * Create custom error
 */
function createError(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
  return new AppError(message, statusCode, errorCode);
}

/**
 * Centralized error handler middleware
 * Must be last middleware in express app
 */
function errorHandler(err, req, res, next) {
  // Log error
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      statusCode: err.statusCode || 500,
      code: err.errorCode || 'UNKNOWN',
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Default error values
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let message = err.message || 'خطأ داخلي في الخادم';

  // Handle specific database errors
  if (err.code === '23505') {
    // Unique constraint violation
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'هذا السجل موجود بالفعل';
  } else if (err.code === '23503') {
    // Foreign key violation
    statusCode = 400;
    errorCode = 'INVALID_REFERENCE';
    message = 'المرجع المحدد غير صحيح';
  } else if (err.code === '42P01') {
    // Table not found
    statusCode = 500;
    errorCode = 'DATABASE_ERROR';
    message = 'خطأ في قاعدة البيانات';
  }

  // Handle Joi validation errors
  if (err.details) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const errors = err.details.map(detail => ({
      field: detail.context.label || detail.path.join('.'),
      message: detail.message,
    }));
    
    return res.status(statusCode).json({
      success: false,
      message: 'خطأ في التحقق من البيانات',
      errorCode,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'رمز المصادقة غير صالح';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'انتهت صلاحية رمز المصادقة';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
}

/**
 * 404 Not Found middleware
 * Should be placed after all routes
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(
    `لم يتم العثور على المسار: ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
  next(error);
}

module.exports = {
  AppError,
  ErrorTypes,
  createError,
  errorHandler,
  notFoundHandler,
};
