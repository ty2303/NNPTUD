import { Router } from 'express';
import * as userCtrl from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

// User (self)
router.get('/me',                authenticate, userCtrl.getMe);
router.put('/me',                authenticate, userCtrl.updateMe);
router.put('/me/password',       authenticate, userCtrl.changePassword);
router.post('/me/setup-password',authenticate, userCtrl.setupPassword);

// Admin
router.get('/',          authenticate, requireAdmin, userCtrl.getAllUsers);
router.get('/:id',       authenticate, requireAdmin, userCtrl.getUserById);
router.patch('/:id/ban', authenticate, requireAdmin, userCtrl.toggleBan);
router.patch('/:id/role',authenticate, requireAdmin, userCtrl.updateRole);

export default router;
