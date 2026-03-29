const { Router } = require('express');
const userCtrl = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

const router = Router();

// User (self)
router.get('/me', authenticate, userCtrl.getMe);
router.put('/me', authenticate, userCtrl.updateMe);
router.put('/me/password', authenticate, userCtrl.changePassword);
router.post('/me/setup-password', authenticate, userCtrl.setupPassword);

// Admin
router.get('/', authenticate, requireAdmin, userCtrl.getAllUsers);
router.get('/:id', authenticate, requireAdmin, userCtrl.getUserById);
router.patch('/:id/ban', authenticate, requireAdmin, userCtrl.toggleBan);
router.patch('/:id/role', authenticate, requireAdmin, userCtrl.updateRole);

module.exports = router;
