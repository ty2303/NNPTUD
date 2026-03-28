import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../services/jwt.service';
import { JwtPayload, LoginDto, RegisterDto, Role } from '../types';

type AuthSuccessData = {
  token: string;
  id: string;
  username: string;
  email: string;
  role: Role;
};

type LoginBody = LoginDto & {
  email?: string;
};

const buildAuthResponse = (user: {
  _id: { toString(): string };
  username: string;
  email: string;
  role: Role;
}): AuthSuccessData => {
  const payload: JwtPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return {
    token: generateToken(payload),
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body as RegisterDto;

    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const [existingUserByEmail, existingUserByUsername] = await Promise.all([
      User.findOne({ email: normalizedEmail }).lean(),
      User.findOne({ username: normalizedUsername }).lean(),
    ]);

    if (existingUserByEmail) {
      res.status(409).json({ success: false, message: 'Email is already in use' });
      return;
    }

    if (existingUserByUsername) {
      res.status(409).json({ success: false, message: 'Username is already in use' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      hasPassword: true,
    });

    res.status(201).json({
      success: true,
      message: 'Register successful',
      data: buildAuthResponse({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Register failed';
    res.status(500).json({ success: false, message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body as LoginBody;
    const identifier = username?.trim() || email?.trim().toLowerCase() || '';

    if (!identifier || typeof password !== 'string' || password.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Username or email and password are required',
      });
      return;
    }

    const query = username?.trim()
      ? { username: username.trim() }
      : { email: email!.trim().toLowerCase() };

    const user = await User.findOne(query).select('+password');

    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (user.banned) {
      res.status(403).json({ success: false, message: 'Your account has been banned' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: buildAuthResponse({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(500).json({ success: false, message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Forgot password is not implemented yet' });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Reset password is not implemented yet' });
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'Google login is not implemented yet' });
};
