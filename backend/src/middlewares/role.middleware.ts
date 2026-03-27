import { Response, NextFunction } from 'express';
import { AuthRequest, Role } from '../types';

// Middleware: kiểm tra role của user
export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // TODO: implement role authorization middleware
    // 1. Kiểm tra req.user có tồn tại không
    // 2. Kiểm tra req.user.role có nằm trong danh sách roles không
    // 3. Gọi next() nếu có quyền, trả 403 nếu không
  };
};

// Shortcut middlewares
export const requireAdmin = requireRole(Role.ADMIN);
export const requireUser  = requireRole(Role.USER, Role.ADMIN);
