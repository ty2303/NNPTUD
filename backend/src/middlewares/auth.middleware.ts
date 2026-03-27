import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

// Middleware: xác thực JWT token từ header Authorization: Bearer <token>
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // TODO: implement JWT authentication middleware
  // 1. Lấy token từ header: req.headers.authorization
  // 2. Kiểm tra format "Bearer <token>"
  // 3. Verify token bằng jwt.verify()
  // 4. Gán thông tin user vào req.user
  // 5. Gọi next() nếu hợp lệ, trả 401 nếu không
};
