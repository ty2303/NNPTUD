import { Clock3, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, Navigate, useLocation } from 'react-router';

export const Component = CheckoutPending;

function CheckoutPending() {
  const location = useLocation();
  const state = location.state as {
    fromCheckout?: boolean;
    orderId?: string;
  } | null;

  if (!state?.fromCheckout) {
    return <Navigate to="/products" replace />;
  }

  const orderId = state.orderId ?? 'N/A';

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-md text-center"
      >
        <div className="mb-8 flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 ring-8 ring-amber-50"
          >
            <Clock3 className="h-12 w-12 text-amber-600" strokeWidth={2.5} />
          </motion.div>
        </div>

        <h1 className="font-display text-3xl font-bold text-text-primary">
          Đang chờ thanh toán
        </h1>

        <p className="mt-4 text-text-secondary">
          Đơn hàng
          <span className="font-mono font-bold text-text-primary"> #{orderId}</span>
          {' '}đã được tạo với phương thức MoMo và đang ở trạng thái chờ thanh toán.
        </p>

        <p className="mt-2 text-sm text-text-muted">
          Hiện tại tính năng MoMo chưa tích hợp hoàn tất, nên hệ thống tạm giữ đơn
          ở bước này.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/profile"
            className="btn-primary flex items-center justify-center gap-2 no-underline"
          >
            Theo dõi đơn hàng
          </Link>
          <Link
            to="/products"
            className="btn-outline flex items-center justify-center gap-2 no-underline"
          >
            <ShoppingBag className="h-4 w-4" />
            Tiếp tục mua sắm
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
