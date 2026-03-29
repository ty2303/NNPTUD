import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AuthRequest, Role } from '../types';

const getUser = (req: Request) => (req as AuthRequest).user!;

// GET /api/users/me
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(getUser(req).id);
    if (!user) { res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' }); return; }
    res.json({ success: true, message: 'OK', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// PUT /api/users/me
export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, avatar } = req.body;
    const user = await User.findByIdAndUpdate(getUser(req).id, { username, avatar }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Cập nhật thông tin thành công', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// PUT /api/users/me/password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' }); return;
    }

    const user = await User.findById(getUser(req).id).select('+password');
    if (!user || !user.password) {
      res.status(400).json({ success: false, message: 'Tài khoản chưa có mật khẩu' }); return;
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' }); return;
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// POST /api/users/me/setup-password
export const setupPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    if (!password) { res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu' }); return; }

    const user = await User.findById(getUser(req).id);
    if (!user)           { res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' }); return; }
    if (user.hasPassword){ res.status(400).json({ success: false, message: 'Tài khoản đã có mật khẩu' }); return; }

    user.password    = await bcrypt.hash(password, 12);
    user.hasPassword = true;
    await user.save();
    res.json({ success: true, message: 'Thiết lập mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// GET /api/users  (admin)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const size = Math.min(Math.max(Number(req.query.size ?? req.query.limit ?? 10), 1), 100);
    const { search } = req.query;
    const query = search
      ? { $or: [{ username: { $regex: String(search), $options: 'i' } }, { email: { $regex: String(search), $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * size).limit(size),
      User.countDocuments(query),
    ]);
    res.json({
      success: true,
      message: 'OK',
      data: {
        content: users,
        number: page - 1,
        size,
        totalPages: Math.ceil(total / size) || 1,
        totalElements: total,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// GET /api/users/:id  (admin)
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' }); return; }
    res.json({ success: true, message: 'OK', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// PATCH /api/users/:id/ban  (admin)
export const toggleBan = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.params.id === getUser(req).id) {
      res.status(400).json({ success: false, message: 'Không thể tự khóa tài khoản của mình' }); return;
    }
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' }); return; }
    user.banned = !user.banned;
    await user.save();
    res.json({ success: true, message: user.banned ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// PATCH /api/users/:id/role  (admin)
export const updateRole = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.params.id === getUser(req).id) {
      res.status(400).json({ success: false, message: 'Không thể thay đổi role của chính mình' }); return;
    }
    const { role } = req.body;
    if (!Object.values(Role).includes(role)) {
      res.status(400).json({ success: false, message: 'Role không hợp lệ' }); return;
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) { res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' }); return; }
    res.json({ success: true, message: 'Cập nhật role thành công', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};
