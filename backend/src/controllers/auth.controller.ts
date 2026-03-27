import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User';
import { generateTokens, generateAccessToken, verifyRefreshToken } from '../services/jwt.service';
import { sendPasswordResetEmail } from '../services/email.service';
import { RegisterDto, LoginDto, Role, AuthRequest } from '../types';
import { config } from '../config/env';

// Helper: trả về cả 2 token + lưu refreshToken vào DB
const issueTokens = async (userId: string, email: string, role: Role) => {
  const payload                   = { id: userId, email, role };
  const { accessToken, refreshToken } = generateTokens(payload);

  await User.findByIdAndUpdate(userId, { refreshToken });

  return { accessToken, refreshToken };
};

// ─────────────────────────────────────────────────────────────

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password }: RegisterDto = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.create({ username, email: email.toLowerCase(), password: hashed, hasPassword: true });

    const { accessToken, refreshToken } = await issueTokens(user._id.toString(), user.email, user.role);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        accessToken,
        refreshToken,
        user: { id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginDto = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    if (user.banned) {
      res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    const { accessToken, refreshToken } = await issueTokens(user._id.toString(), user.email, user.role);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        accessToken,
        refreshToken,
        user: { id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar, hasPassword: user.hasPassword },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// POST /api/auth/refresh
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token là bắt buộc' });
      return;
    }

    // Verify chữ ký
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
      return;
    }

    // Kiểm tra token có khớp trong DB không (chống reuse sau logout)
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token không hợp lệ' });
      return;
    }

    if (user.banned) {
      res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
      return;
    }

    // Cấp access token mới (giữ nguyên refresh token)
    const newAccessToken = generateAccessToken({ id: user._id.toString(), email: user.email, role: user.role });

    res.json({
      success: true,
      message: 'Token mới đã được cấp',
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Xóa refresh token trong DB → token cũ không dùng được nữa
      await User.findOneAndUpdate({ refreshToken }, { $unset: { refreshToken: 1 } });
    }

    res.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.json({ success: true, message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken   = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch {
      // Email chưa cấu hình — vẫn trả success, log token ra console khi dev
      if (config.nodeEnv === 'development') {
        console.log(`[DEV] Reset URL: ${resetUrl}`);
      }
    }

    res.json({ success: true, message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ success: false, message: 'Thiếu token hoặc mật khẩu mới' });
      return;
    }

    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!user) {
      res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
      return;
    }

    user.password             = await bcrypt.hash(password, 12);
    user.hasPassword          = true;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken         = undefined; // buộc đăng nhập lại
    await user.save();

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập lại' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// GET /api/auth/google/callback
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  const u = (req as AuthRequest).user as { id: string; email: string; role: Role };
  const { accessToken, refreshToken } = await issueTokens(u.id, u.email, u.role);
  res.redirect(`${config.clientUrl}/oauth2/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
};
