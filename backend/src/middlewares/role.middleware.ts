import { Response, NextFunction } from 'express';
import { AuthRequest, Role } from '../types';

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(Role.ADMIN);
export const requireUser  = requireRole(Role.USER, Role.ADMIN);
