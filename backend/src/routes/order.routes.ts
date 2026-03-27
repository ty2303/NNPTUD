import { Router } from 'express';
import * as orderCtrl from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

router.post('/',              authenticate, orderCtrl.createOrder);
router.get('/my',             authenticate, orderCtrl.getMyOrders);
router.get('/',               authenticate, requireAdmin, orderCtrl.getAllOrders);
router.patch('/:id/status',   authenticate, requireAdmin, orderCtrl.updateOrderStatus);
router.patch('/:id/cancel',   authenticate, orderCtrl.cancelOrder);

export default router;
