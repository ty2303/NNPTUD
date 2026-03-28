import { NextFunction, Request, Response } from 'express';
import { AuthRequest, Role } from '../types';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    next();
  };
};

// Shortcut middlewares
export const requireAdmin = requireRole(Role.ADMIN);
export const requireUser  = requireRole(Role.USER, Role.ADMIN);
