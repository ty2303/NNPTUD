import { Router } from 'express';
import * as categoryCtrl from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

router.get('/',    categoryCtrl.getCategories);
router.get('/:id', categoryCtrl.getCategoryById);
router.post('/',   authenticate, requireAdmin, categoryCtrl.createCategory);
router.put('/:id', authenticate, requireAdmin, categoryCtrl.updateCategory);
router.delete('/:id', authenticate, requireAdmin, categoryCtrl.deleteCategory);

export default router;
