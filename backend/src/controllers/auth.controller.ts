import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User';
import { generateToken } from '../services/jwt.service';
import { sendPasswordResetEmail } from '../services/email.service';
import { RegisterDto, LoginDto, Role } from '../types';

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password }: RegisterDto = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email already in use' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, password: hashed, hasPassword: true });

    const token = generateToken({ id: user._id.toString(), email: user.email, role: user.role });
    res.status(201).json({ success: true, message: 'Registered successfully', data: { token, user: { id: user._id, username, email, role: user.role } } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginDto = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (user.banned) {
      res.status(403).json({ success: false, message: 'Account is banned' });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ id: user._id.toString(), email: user.email, role: user.role });
    res.json({ success: true, message: 'Login successful', data: { token, user: { id: user._id, username: user.username, email, role: user.role, avatar: user.avatar } } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken   = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    user.password             = await bcrypt.hash(password, 12);
    user.hasPassword          = true;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// GET /api/auth/google/callback  (handled by Passport)
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { id: string; email: string; role: Role };
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.redirect(`${process.env.CLIENT_URL}/oauth2/callback?token=${token}`);
};
