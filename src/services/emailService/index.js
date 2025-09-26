// emailerServices/index.js
import nodemailer from 'nodemailer';
import logger from '~/config/logger';
import template from './template';
import config from '~/config/config';

export const transport = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: false,
  auth: {
    user: config.SMTP_USERNAME,
    pass: config.SMTP_PASSWORD,
  }
});

if (config.NODE_ENV !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server'));
}

export const sendEmail = async (to, subject, html) => {
  const msg = {
    from: `${config.APP_NAME} <${config.EMAIL_FROM}>`,
    to,
    subject,
    html,
  };
  await transport.sendMail(msg);
};

// 🔹 Reset password via link
export const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset Password';
  const resetPasswordUrl = `${config.FRONTEND_URL}/reset-password?token=${token}`;
  const html = template.resetPassword(resetPasswordUrl, config.APP_NAME);
  await sendEmail(to, subject, html);
};

// 🔹 Email verification via link
export const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = `${config.FRONTEND_URL}/verify-email?token=${token}`;
  const html = template.verifyEmail(verificationEmailUrl, config.APP_NAME);
  await sendEmail(to, subject, html);
};

// 🔹 OTP for Forgot Password / Login / Signup
export const sendOtpEmail = async (to, otp, type = 'OTP Verification') => {
  const subject = `${config.APP_NAME} - ${type}`;
  const html = template.otpTemplate(otp, config.APP_NAME, type);
  await sendEmail(to, subject, html);
};

export default {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendOtpEmail,
};
