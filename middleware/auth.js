const { extractTokenFromHeader, verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware to verify JWT token
 */
const authenticateToken = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'لم يتم توفير رمز المصادقة',
        error: 'No token provided',
      });
    }

    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'رمز المصادقة غير صالح أو منتهي الصلاحية',
      error: error.message,
    });
  }
};

/**
 * Middleware to check user roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'لم يتم المصادقة',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'لا تملك صلاحيات كافية لإجراء هذا الإجراء',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
      };
    }
  } catch (error) {
    // Silently ignore invalid tokens in optional auth
  }
  
  next();
};

module.exports = {
  authenticateToken,
  authorize,
  optionalAuth,
};
