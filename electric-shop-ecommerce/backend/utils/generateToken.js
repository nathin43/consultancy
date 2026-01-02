const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * @param {string} id - User or Admin ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = generateToken;
