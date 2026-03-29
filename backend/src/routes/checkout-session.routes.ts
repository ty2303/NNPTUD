import { Router } from 'express';
import * as checkoutSessionCtrl from '../controllers/checkout-session.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.post('/', checkoutSessionCtrl.createCheckoutSession);
router.get('/:id', checkoutSessionCtrl.getCheckoutSessionById);
router.post('/:id/confirm', checkoutSessionCtrl.confirmCheckoutSession);
router.delete('/:id', checkoutSessionCtrl.cancelCheckoutSession);

export default router;
