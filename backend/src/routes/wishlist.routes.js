const { Router } = require('express');
const wishlistCtrl = require('../controllers/wishlist.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);
router.get('/', wishlistCtrl.getWishlist);
router.post('/:productId', wishlistCtrl.toggleWishlist);
router.delete('/', wishlistCtrl.clearWishlist);

module.exports = router;
