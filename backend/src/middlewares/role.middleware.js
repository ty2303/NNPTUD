const { Role } = require('../types');

const requireRole = (...roles) => {
  return (req, res, next) => {
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

const requireAdmin = requireRole(Role.ADMIN);
const requireUser = requireRole(Role.USER, Role.ADMIN);

module.exports = { requireRole, requireAdmin, requireUser };
