import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { config } from '../config/env';
import { User } from '../models/User';
import { sendPasswordResetEmail } from '../services/email.service';
import { generateAccessToken, generateTokens, verifyRefreshToken } from '../services/jwt.service';
import { AuthRequest, LoginDto, RegisterDto, Role } from '../types';

const issueTokens = async (userId: string, email: string, role: Role) => {
  const payload = { id: userId, email, role };
  const { accessToken, refreshToken } = generateTokens(payload);

  await User.findByIdAndUpdate(userId, { refreshToken });

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password }: RegisterDto = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
      res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const [existingByEmail, existingByUsername] = await Promise.all([
      User.findOne({ email: normalizedEmail }).lean(),
      User.findOne({ username: normalizedUsername }).lean(),
    ]);

    if (existingByEmail) {
      res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
      return;
    }

    if (existingByUsername) {
      res.status(400).json({ success: false, message: 'Tên đăng nhập đã được sử dụng' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      hasPassword: true,
    });

    const { accessToken, refreshToken } = await issueTokens(user._id.toString(), user.email, user.role);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          hasPassword: user.hasPassword,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    res.status(500).json({ success: false, message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginDto & { email?: string };

    if (!email?.trim() || !password) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
      return;
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    if (user.banned) {
      res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
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
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          hasPassword: user.hasPassword,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    res.status(500).json({ success: false, message });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token là bắt buộc' });
      return;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
      return;
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token không hợp lệ' });
      return;
    }

    if (user.banned) {
      res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
      return;
    }

    const accessToken = generateAccessToken({ id: user._id.toString(), email: user.email, role: user.role });

    res.json({
      success: true,
      message: 'Token mới đã được cấp',
      data: { accessToken },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    res.status(500).json({ success: false, message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, { $unset: { refreshToken: 1 } });
    }

    res.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    res.status(500).json({ success: false, message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.json({ success: true, message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(normalizedEmail, resetUrl);
    } catch {
      if (config.nodeEnv === 'development') {
        console.log(`[DEV] Reset URL: ${resetUrl}`);
      }
    }

    res.json({ success: true, message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    res.status(500).json({ success: false, message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ success: false, message: 'Thiếu token hoặc mật khẩu mới' });
      return;
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
      return;
    }

    user.password = await bcrypt.hash(password, 12);
    user.hasPassword = true;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined;
    await user.save();

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập lại' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    res.status(500).json({ success: false, message });
  }
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user as { id: string; email: string; role: Role };
  const { accessToken, refreshToken } = await issueTokens(user.id, user.email, user.role);
  res.redirect(`${config.clientUrl}/oauth2/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
};
