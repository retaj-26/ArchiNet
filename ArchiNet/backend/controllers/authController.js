const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/database');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { getLogger } = require('../middleware/logger');

const logger = getLogger('AuthController');

/**
 * User Registration
 */
async function register(req, res, next) {
  try {
    const { email, password, confirmPassword, fullName, phoneNumber, companyName } = req.body;

    // Validate passwords match
    if (password !== confirmPassword) {
      const error = new Error('كلمات المرور غير متطابقة');
      error.statusCode = 400;
      return next(error);
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      const error = new Error('هذا البريد الإلكتروني مسجل بالفعل');
      error.statusCode = 409;
      error.errorCode = 'DUPLICATE_EMAIL';
      return next(error);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone_number, company_name, role, subscription_tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, role, subscription_tier, created_at`,
      [email, passwordHash, fullName, phoneNumber, companyName, 'user', 'free']
    );

    const user = result.rows[0];

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, 'user');

    // Log registration
    logger.info('User registered', { userId: user.id, email });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          subscriptionTier: user.subscription_tier,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    next(error);
  }
}

/**
 * User Login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role, subscription_tier, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      const error = new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      error.statusCode = 401;
      return next(error);
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      const error = new Error('هذا الحساب معطل');
      error.statusCode = 403;
      error.errorCode = 'ACCOUNT_DISABLED';
      return next(error);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const error = new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      error.statusCode = 401;
      return next(error);
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = NOW(), last_ip_address = $1 WHERE id = $2',
      [req.ip, user.id]
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Store session
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.query(
      `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [user.id, tokenHash, req.ip, req.get('user-agent')]
    );

    logger.info('User logged in', { userId: user.id, email });

    res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          subscriptionTier: user.subscription_tier,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    next(error);
  }
}

/**
 * Refresh Access Token
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      const error = new Error('رمز التحديث مطلوب');
      error.statusCode = 400;
      return next(error);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Check if session exists
    const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
    const sessionResult = await pool.query(
      'SELECT * FROM user_sessions WHERE token_hash = $1 AND is_active = true',
      [tokenHash]
    );

    if (sessionResult.rows.length === 0) {
      const error = new Error('جلسة غير صالحة');
      error.statusCode = 401;
      error.errorCode = 'INVALID_SESSION';
      return next(error);
    }

    // Get user info
    const userResult = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    const user = userResult.rows[0];

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'تم تحديث الرمز بنجاح',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error('Refresh token error', { error: error.message });
    next(error);
  }
}

/**
 * Logout
 */
async function logout(req, res, next) {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await pool.query(
        'UPDATE user_sessions SET is_active = false WHERE token_hash = $1',
        [tokenHash]
      );
    }

    logger.info('User logged out', { userId: req.user?.userId });

    res.status(200).json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    next(error);
  }
}

/**
 * Get Current User
 */
async function getCurrentUser(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, phone_number, company_name, role, subscription_tier, avatar_url FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      const error = new Error('المستخدم غير موجود');
      error.statusCode = 404;
      return next(error);
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phoneNumber: user.phone_number,
          companyName: user.company_name,
          role: user.role,
          subscriptionTier: user.subscription_tier,
          avatarUrl: user.avatar_url,
        },
      },
    });
  } catch (error) {
    logger.error('Get current user error', { error: error.message });
    next(error);
  }
}

/**
 * Update User Profile
 */
async function updateProfile(req, res, next) {
  try {
    const { fullName, phoneNumber, companyName, avatarUrl } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, phone_number = $2, company_name = $3, avatar_url = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, full_name, phone_number, company_name, avatar_url`,
      [fullName, phoneNumber, companyName, avatarUrl, req.user.userId]
    );

    if (result.rows.length === 0) {
      const error = new Error('فشل تحديث الملف الشخصي');
      error.statusCode = 400;
      return next(error);
    }

    const user = result.rows[0];

    logger.info('User profile updated', { userId: req.user.userId });

    res.status(200).json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phoneNumber: user.phone_number,
          companyName: user.company_name,
          avatarUrl: user.avatar_url,
        },
      },
    });
  } catch (error) {
    logger.error('Update profile error', { error: error.message });
    next(error);
  }
}

/**
 * Change Password
 */
async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      const error = new Error('كلمات المرور الجديدة غير متطابقة');
      error.statusCode = 400;
      return next(error);
    }

    // Get user
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      const error = new Error('المستخدم غير موجود');
      error.statusCode = 404;
      return next(error);
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);

    if (!isPasswordValid) {
      const error = new Error('كلمة المرور القديمة غير صحيحة');
      error.statusCode = 401;
      return next(error);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, req.user.userId]
    );

    logger.info('User password changed', { userId: req.user.userId });

    res.status(200).json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  } catch (error) {
    logger.error('Change password error', { error: error.message });
    next(error);
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
};
