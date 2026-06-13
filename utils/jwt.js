const jwt = require('jsonwebtoken');

/**
 * JWT Token Utilities
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '30d';

/**
 * Generate Access Token
 */
function generateAccessToken(userId, role = 'user') {
  return jwt.sign(
    {
      userId,
      role,
      type: 'access',
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRY,
      issuer: 'archinet',
      subject: userId,
    }
  );
}

/**
 * Generate Refresh Token
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    {
      userId,
      type: 'refresh',
    },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'archinet',
      subject: userId,
    }
  );
}

/**
 * Generate Both Tokens
 */
function generateTokens(userId, role = 'user') {
  return {
    accessToken: generateAccessToken(userId, role),
    refreshToken: generateRefreshToken(userId),
  };
}

/**
 * Verify Access Token
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'archinet',
    });
  } catch (error) {
    throw new Error(`Invalid access token: ${error.message}`);
  }
}

/**
 * Verify Refresh Token
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'archinet',
    });
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
}

/**
 * Decode Token (without verification)
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Extract Token from Bearer Header
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader,
};
