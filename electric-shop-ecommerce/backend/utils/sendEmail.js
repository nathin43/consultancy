const nodemailer = require('nodemailer');

/**
 * Send Email with OTP
 * Configure your email service credentials in environment variables
 */
const sendOTPEmail = async (email, otp) => {
  try {
    // Create transporter
    // Update these with your email service credentials
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification OTP - Electric Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Electric Shop - Email Verification</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
            <p style="color: #666;">Hello,</p>
            <p style="color: #666;">Thank you for registering with Electric Shop. Please use the following OTP to verify your email address:</p>
            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #ff6b35; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #ff6b35; text-align: center; margin: 0;">${otp}</p>
            </div>
            <p style="color: #666;">This OTP is valid for <strong>10 minutes</strong>.</p>
            <p style="color: #666;">If you did not request this verification, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2024 Electric Shop. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: 'Failed to send OTP email' };
  }
};

module.exports = { sendOTPEmail };
