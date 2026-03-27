import { Router } from 'express';
import * as productCtrl from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

router.get('/',    productCtrl.getProducts);
router.get('/:id', productCtrl.getProductById);
router.post('/',   authenticate, requireAdmin, productCtrl.createProduct);
router.put('/:id', authenticate, requireAdmin, productCtrl.updateProduct);
router.delete('/:id', authenticate, requireAdmin, productCtrl.deleteProduct);

export default router;
