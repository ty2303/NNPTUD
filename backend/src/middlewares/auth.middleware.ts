import { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';
import { verifyToken } from '../services/jwt.service';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication token is required' });
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication token is required' });
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.id).lean();

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.banned) {
      res.status(403).json({ success: false, message: 'Your account has been banned' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid authentication token';
    res.status(401).json({ success: false, message });
  }
};
