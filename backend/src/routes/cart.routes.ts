import { Router } from 'express';
import * as cartCtrl from '../controllers/cart.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/',                cartCtrl.getCart);
router.post('/items',          cartCtrl.addItem);
router.put('/items/:productId',cartCtrl.updateItem);
router.delete('/items/:productId', cartCtrl.removeItem);
router.post('/sync',           cartCtrl.syncCart);
router.delete('/',             cartCtrl.clearCart);

export default router;
