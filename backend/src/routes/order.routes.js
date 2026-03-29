const { Router } = require('express');
const orderCtrl = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

const router = Router();

router.post('/', authenticate, orderCtrl.createOrder);
router.get('/my', authenticate, orderCtrl.getMyOrders);
router.get('/', authenticate, requireAdmin, orderCtrl.getAllOrders);
router.patch('/:id/status', authenticate, requireAdmin, orderCtrl.updateOrderStatus);
router.patch('/:id/cancel', authenticate, orderCtrl.cancelOrder);

module.exports = router;
