const { Router } = require('express');
const productCtrl = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

const router = Router();

router.get('/', productCtrl.getProducts);
router.get('/:id', productCtrl.getProductById);
router.post('/', authenticate, requireAdmin, productCtrl.createProduct);
router.put('/:id', authenticate, requireAdmin, productCtrl.updateProduct);
router.delete('/:id', authenticate, requireAdmin, productCtrl.deleteProduct);

module.exports = router;
