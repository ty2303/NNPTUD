const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const { Role } = require('../types');

const getUser = (req) => req.user;

// GET /api/users/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(getUser(req).id);
    if (!user) { res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' }); return; }
    res.json({ success: true, message: 'OK', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// PUT /api/users/me
const updateMe = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const user = await User.findByIdAndUpdate(getUser(req).id, { username, avatar }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Cập nhật thông tin thành công', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// PUT /api/users/me/password
const changePassword = async (req, res) => {
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
const setupPassword = async (req, res) => {
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
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = search
      ? { $or: [{ username: { $regex: String(search), $options: 'i' } }, { email: { $regex: String(search), $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((+page - 1) * +limit).limit(+limit),
      User.countDocuments(query),
    ]);
    res.json({ success: true, message: 'OK', data: { users, total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// GET /api/users/:id  (admin)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' }); return; }
    res.json({ success: true, message: 'OK', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server', data: err });
  }
};

// PATCH /api/users/:id/ban  (admin)
const toggleBan = async (req, res) => {
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
const updateRole = async (req, res) => {
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

module.exports = {
  getMe,
  updateMe,
  changePassword,
  setupPassword,
  getAllUsers,
  getUserById,
  toggleBan,
  updateRole,
};
