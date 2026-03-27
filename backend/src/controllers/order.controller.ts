import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';
import { AuthRequest, OrderStatus, Role } from '../types';

// POST /api/orders
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderCode = `ORD-${uuidv4().split('-')[0].toUpperCase()}`;
    const order = await Order.create({ ...req.body, userId: req.user!.id, orderCode });

    // clear cart after order
    await Cart.findOneAndUpdate({ userId: req.user!.id }, { items: [] });

    res.status(201).json({ success: true, message: 'Order created', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// GET /api/orders/my
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.json({ success: true, message: 'OK', data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// GET /api/orders  (admin)
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query: Record<string, unknown> = {};
    if (status) query.status = String(status);

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((+page - 1) * +limit).limit(+limit),
      Order.countDocuments(query),
    ]);
    res.json({ success: true, message: 'OK', data: { orders, total, page: +page, totalPages: Math.ceil(total / +limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PATCH /api/orders/:id/status  (admin)
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!Object.values(OrderStatus).includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PATCH /api/orders/:id/cancel
export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }

    const isOwner = order.userId === req.user!.id;
    const isAdmin = req.user!.role === Role.ADMIN;
    if (!isOwner && !isAdmin) { res.status(403).json({ success: false, message: 'Forbidden' }); return; }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      res.status(400).json({ success: false, message: 'Cannot cancel order at this stage' });
      return;
    }

    order.status       = OrderStatus.CANCELLED;
    order.cancelReason = req.body.cancelReason || '';
    order.cancelledBy  = req.user!.id;
    await order.save();

    res.json({ success: true, message: 'Order cancelled', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};
