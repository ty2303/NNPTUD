import nodemailer from 'nodemailer';
import { config } from '../config/env';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: { user: config.email.user, pass: config.email.pass },
});

export const sendPasswordResetEmail = async (to: string, resetUrl: string): Promise<void> => {
  await transporter.sendMail({
    from: `"NNPTUD Shop" <${config.email.user}>`,
    to,
    subject: 'Reset your password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:5px;">
        Reset Password
      </a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
};

export const sendOrderConfirmationEmail = async (to: string, orderCode: string, total: number): Promise<void> => {
  await transporter.sendMail({
    from: `"NNPTUD Shop" <${config.email.user}>`,
    to,
    subject: `Order Confirmation - ${orderCode}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Your order <strong>${orderCode}</strong> has been placed successfully.</p>
      <p>Total: <strong>${total.toLocaleString('vi-VN')} ₫</strong></p>
    `,
  });
};
