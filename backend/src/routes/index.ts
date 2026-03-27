import { Router } from 'express';
import authRoutes         from './auth.routes';
import userRoutes         from './user.routes';
import productRoutes      from './product.routes';
import categoryRoutes     from './category.routes';
import cartRoutes         from './cart.routes';
import orderRoutes        from './order.routes';
import reviewRoutes       from './review.routes';
import wishlistRoutes     from './wishlist.routes';
import uploadRoutes       from './upload.routes';
import voucherRoutes      from './voucher.routes';
import notificationRoutes from './notification.routes';
import addressRoutes      from './address.routes';

const router = Router();

router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/products',      productRoutes);
router.use('/categories',    categoryRoutes);
router.use('/cart',          cartRoutes);
router.use('/orders',        orderRoutes);
router.use('/reviews',       reviewRoutes);
router.use('/wishlist',      wishlistRoutes);
router.use('/upload',        uploadRoutes);
router.use('/vouchers',      voucherRoutes);
router.use('/notifications', notificationRoutes);
router.use('/addresses',     addressRoutes);

export default router;
