const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { config } = require('../config/env');
const { User } = require('../models/User');
const { sendPasswordResetEmail } = require('../services/email.service');
const { generateAccessToken, generateTokens, verifyRefreshToken } = require('../services/jwt.service');
const { Role } = require('../types');

const issueTokens = async (userId, email, role) => {
  const payload = { id: userId, email, role };
  const { accessToken, refreshToken } = generateTokens(payload);

  await User.findByIdAndUpdate(userId, { refreshToken });

  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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

const refresh = async (req, res) => {
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

const logout = async (req, res) => {
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

const forgotPassword = async (req, res) => {
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

const resetPassword = async (req, res) => {
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

const googleCallback = async (req, res) => {
  const user = req.user;
  const { accessToken, refreshToken } = await issueTokens(user.id, user.email, user.role);
  res.redirect(`${config.clientUrl}/oauth2/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  googleCallback,
};
