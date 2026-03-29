const { Router } = require('express');
const cartCtrl = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);
router.get('/', cartCtrl.getCart);
router.post('/items', cartCtrl.addItem);
router.put('/items/:productId', cartCtrl.updateItem);
router.delete('/items/:productId', cartCtrl.removeItem);
router.post('/sync', cartCtrl.syncCart);
router.delete('/', cartCtrl.clearCart);

module.exports = router;
