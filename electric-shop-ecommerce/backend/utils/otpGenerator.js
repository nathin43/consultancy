/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get OTP expiry time (10 minutes from now)
 */
const getOTPExpiryTime = () => {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 10);
  return expiryTime;
};

/**
 * Check if OTP has expired
 */
const isOTPExpired = (expiryTime) => {
  return new Date() > new Date(expiryTime);
};

module.exports = {
  generateOTP,
  getOTPExpiryTime,
  isOTPExpired
};
