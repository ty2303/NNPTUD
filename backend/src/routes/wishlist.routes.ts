import { Router } from 'express';
import * as wishlistCtrl from '../controllers/wishlist.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/',                 wishlistCtrl.getWishlist);
router.post('/:productId',      wishlistCtrl.toggleWishlist);
router.delete('/',              wishlistCtrl.clearWishlist);

export default router;
