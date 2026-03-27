import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AuthRequest, Role } from '../types';

// GET /api/users/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, message: 'OK', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PUT /api/users/me
export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user!.id, { username, avatar }, { new: true });
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PUT /api/users/me/password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user!.id).select('+password');
    if (!user || !user.password) { res.status(400).json({ success: false, message: 'No password set' }); return; }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) { res.status(400).json({ success: false, message: 'Incorrect current password' }); return; }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/users/me/setup-password
export const setupPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    if (user.hasPassword) { res.status(400).json({ success: false, message: 'Password already set' }); return; }

    user.password    = await bcrypt.hash(password, 12);
    user.hasPassword = true;
    await user.save();
    res.json({ success: true, message: 'Password set successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// ---- ADMIN ----

// GET /api/users  (admin)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = search ? { $or: [{ username: new RegExp(String(search), 'i') }, { email: new RegExp(String(search), 'i') }] } : {};
    const [users, total] = await Promise.all([
      User.find(query).skip((+page - 1) * +limit).limit(+limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);
    res.json({ success: true, message: 'OK', data: { users, total, page: +page, totalPages: Math.ceil(total / +limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// GET /api/users/:id  (admin)
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, message: 'OK', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PATCH /api/users/:id/ban  (admin)
export const toggleBan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.user!.id) { res.status(400).json({ success: false, message: 'Cannot ban yourself' }); return; }
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    user.banned = !user.banned;
    await user.save();
    res.json({ success: true, message: `User ${user.banned ? 'banned' : 'unbanned'}`, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PATCH /api/users/:id/role  (admin)
export const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.user!.id) { res.status(400).json({ success: false, message: 'Cannot change your own role' }); return; }
    const { role } = req.body;
    if (!Object.values(Role).includes(role)) { res.status(400).json({ success: false, message: 'Invalid role' }); return; }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, message: 'Role updated', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};
