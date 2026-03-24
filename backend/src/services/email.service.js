const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  isEnabled() {
    return (
      process.env.EMAIL_DISABLE !== 'true' &&
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    );
  }

  getTransporter() {
    if (!this.isEnabled()) return null;
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return this.transporter;
  }

  async sendEmail(to, subject, html) {
    const transporter = this.getTransporter();
    if (!transporter) {
      console.warn('Email disabled or not configured; skipping send.');
      return;
    }

    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const fromName = process.env.EMAIL_FROM_NAME;

    const mailOptions = {
      from: fromName ? `${fromName} <${fromAddress}>` : fromAddress,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `;

    await this.sendEmail(email, 'Verify Your Email - SoulSupport', html);
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Click the link below:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `;

    await this.sendEmail(email, 'Password Reset - SoulSupport', html);
  }

  async sendSessionBookingEmail(therapistEmail, userName, sessionDate) {
    const html = `
      <h1>New Session Booking</h1>
      <p>${userName} has booked a session with you.</p>
      <p>Date: ${sessionDate}</p>
      <p>Please log in to your dashboard to confirm.</p>
    `;

    await this.sendEmail(therapistEmail, 'New Session Booking - SoulSupport', html);
  }

  async sendSessionConfirmationEmail(userEmail, therapistName, sessionDate) {
    const html = `
      <h1>Session Confirmed</h1>
      <p>Your session with ${therapistName} has been confirmed.</p>
      <p>Date: ${sessionDate}</p>
      <p>You will receive the meeting link before the session.</p>
    `;

    await this.sendEmail(userEmail, 'Session Confirmed - SoulSupport', html);
  }
}

module.exports = new EmailService();
