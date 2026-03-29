const { Router } = require('express');
const categoryCtrl = require('../controllers/category.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

const router = Router();

router.get('/', categoryCtrl.getCategories);
router.get('/:id', categoryCtrl.getCategoryById);
router.post('/', authenticate, requireAdmin, categoryCtrl.createCategory);
router.put('/:id', authenticate, requireAdmin, categoryCtrl.updateCategory);
router.delete('/:id', authenticate, requireAdmin, categoryCtrl.deleteCategory);

module.exports = router;
