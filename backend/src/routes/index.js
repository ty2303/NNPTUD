const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const reviewRoutes = require('./review.routes');
const wishlistRoutes = require('./wishlist.routes');
const uploadRoutes = require('./upload.routes');
const voucherRoutes = require('./voucher.routes');
const notificationRoutes = require('./notification.routes');
const addressRoutes = require('./address.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/upload', uploadRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/notifications', notificationRoutes);
router.use('/addresses', addressRoutes);

module.exports = router;
