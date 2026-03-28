import { RequestHandler } from 'express';
import { User } from '../models/User';
import { verifyAccessToken } from '../services/jwt.service';

export const authenticate: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).lean();

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.banned) {
      res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
