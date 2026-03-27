import { RequestHandler } from 'express';
import { AuthRequest, Role } from '../types';

export const requireRole = (...roles: Role[]): RequestHandler => {
  return (req, res, next) => {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole(Role.ADMIN);
export const requireUser  = requireRole(Role.USER, Role.ADMIN);
