import { Request, Response } from 'express';
import { FilterQuery, isValidObjectId } from 'mongoose';
import { randomUUID } from 'crypto';
import { Cart } from '../models/Cart';
import { Notification } from '../models/Notification';
import { IOrder, Order } from '../models/Order';
import { Product } from '../models/Product';
import { AuthRequest, IOrderItem, NotificationType, OrderStatus, PaymentMethod, PaymentStatus, Role } from '../types';

type CreateOrderItemInput = {
  productId?: unknown;
  productName?: unknown;
  productImage?: unknown;
  brand?: unknown;
  color?: unknown;
  storage?: unknown;
  price?: unknown;
  quantity?: unknown;
};

type CreateOrderBody = {
  email?: unknown;
  customerName?: unknown;
  phone?: unknown;
  address?: unknown;
  city?: unknown;
  district?: unknown;
  ward?: unknown;
  note?: unknown;
  paymentMethod?: unknown;
  items?: unknown;
};

const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

const SHIPPING_FEE = 30000;
const FREE_SHIPPING_THRESHOLD = 500000;

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
};

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const parseOrderItems = (value: unknown): { items?: CreateOrderItemInput[]; message?: string } => {
  if (!Array.isArray(value) || value.length === 0) {
    return { message: 'Đơn hàng phải có ít nhất 1 sản phẩm' };
  }

  const items: CreateOrderItemInput[] = [];

  for (const rawItem of value) {
    if (typeof rawItem !== 'object' || rawItem === null) {
      return { message: 'Danh sách sản phẩm không hợp lệ' };
    }

    items.push(rawItem as CreateOrderItemInput);
  }

  return { items };
};

const generateOrderCode = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `ORD-${timestamp}-${suffix}`;
};

const normalizeOrder = (order: unknown): Record<string, unknown> => {
  const plainOrder = typeof (order as { toObject?: () => unknown }).toObject === 'function'
    ? ((order as { toObject: () => unknown }).toObject() as Record<string, unknown>)
    : (order as Record<string, unknown>);

  const rawId = plainOrder._id;
  const id = typeof rawId === 'string'
    ? rawId
    : rawId && typeof rawId === 'object' && 'toString' in rawId
      ? (rawId as { toString(): string }).toString()
      : '';

  return {
    ...plainOrder,
    id,
  };
};

const createOrderStatusNotification = async (
  order: IOrder,
  title: string,
  message: string,
): Promise<void> => {
  await Notification.create({
    userId: order.userId,
    type: NotificationType.ORDER,
    title,
    message,
    link: `/profile`,
  });
};

const adjustProductStockForOrderItem = async (
  item: IOrderItem,
  quantityDelta: number,
): Promise<void> => {
  const product = await Product.findById(item.productId);
  if (!product) {
    return;
  }

  product.stock = Math.max(product.stock + quantityDelta, 0);

  if (item.color || item.storage) {
    const variant = product.variants.find((entry) => {
      const sameColor = item.color ? entry.color === item.color : true;
      const sameStorage = item.storage ? entry.storage === item.storage : true;
      return sameColor && sameStorage;
    });

    if (variant) {
      variant.stock = Math.max(variant.stock + quantityDelta, 0);
    }
  }

  await product.save();
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
};

// POST /api/orders
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const body = req.body as CreateOrderBody;
    const email = asNonEmptyString(body.email);
    const customerName = asNonEmptyString(body.customerName);
    const phone = asNonEmptyString(body.phone);
    const address = asNonEmptyString(body.address);
    const city = asNonEmptyString(body.city);
    const district = asNonEmptyString(body.district);
    const ward = asNonEmptyString(body.ward);
    const paymentMethod = asNonEmptyString(body.paymentMethod);
    const note = typeof body.note === 'string' && body.note.trim().length > 0 ? body.note.trim() : undefined;

    if (!email || !customerName || !phone || !address || !city || !district || !ward || !paymentMethod) {
      res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin đặt hàng' });
      return;
    }

    if (!Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      res.status(400).json({ success: false, message: 'Phương thức thanh toán không hợp lệ' });
      return;
    }

    const parsedItems = parseOrderItems(body.items);
    if (!parsedItems.items) {
      res.status(400).json({ success: false, message: parsedItems.message });
      return;
    }

    const validatedItems: IOrderItem[] = [];

    for (const item of parsedItems.items) {
      const productId = asNonEmptyString(item.productId);
      const quantity = toNumber(item.quantity);

      if (!productId || quantity === null || !Number.isInteger(quantity) || quantity <= 0) {
        res.status(400).json({ success: false, message: 'Thông tin sản phẩm đặt hàng không hợp lệ' });
        return;
      }

      if (!isValidObjectId(productId)) {
        res.status(400).json({ success: false, message: 'Sản phẩm không hợp lệ' });
        return;
      }

      const product = await Product.findOne({ _id: productId, isActive: true }).lean();

      if (!product) {
        res.status(404).json({ success: false, message: 'Có sản phẩm không tồn tại hoặc đã ngừng bán' });
        return;
      }

      if (product.stock < quantity) {
        res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho`,
        });
        return;
      }

      validatedItems.push({
        productId: product._id.toString(),
        productName: product.name,
        productImage: product.image,
        brand: product.brand,
        color: asNonEmptyString(item.color) ?? undefined,
        storage: asNonEmptyString(item.storage) ?? undefined,
        price: product.price,
        quantity,
      });
    }

    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + shippingFee;

    let createdOrder: IOrder | null = null;
    let attempts = 0;

    while (!createdOrder && attempts < 3) {
      attempts += 1;

      try {
        createdOrder = await Order.create({
          userId: authReq.user.id,
          orderCode: generateOrderCode(),
          email,
          customerName,
          phone,
          address,
          city,
          district,
          ward,
          note,
          paymentMethod,
          paymentStatus: PaymentStatus.UNPAID,
          status: OrderStatus.PENDING,
          items: validatedItems,
          subtotal,
          shippingFee,
          total,
        });
      } catch (error) {
        if (isDuplicateKeyError(error) && attempts < 3) {
          continue;
        }
        throw error;
      }
    }

    if (!createdOrder) {
      res.status(500).json({ success: false, message: 'Không thể tạo đơn hàng, vui lòng thử lại' });
      return;
    }

    await Promise.all([
      Cart.findOneAndUpdate({ userId: authReq.user.id }, { $set: { items: [] } }),
      ...validatedItems.map((item) =>
        adjustProductStockForOrderItem(item, -item.quantity)
      ),
      createOrderStatusNotification(
        createdOrder,
        'Đặt hàng thành công',
        `Đơn hàng ${createdOrder.orderCode} của bạn đã được tạo thành công.`
      ),
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: normalizeOrder(createdOrder),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tạo đơn hàng';
    res.status(500).json({ success: false, message });
  }
};

// GET /api/orders/my
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const orders = await Order.find({ userId: authReq.user.id }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: orders.map((order) => normalizeOrder(order)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy danh sách đơn hàng';
    res.status(500).json({ success: false, message });
  }
};

// GET /api/orders  (admin)
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(toNumber(req.query.page) ?? 1, 1);
    const size = Math.min(Math.max(toNumber(req.query.size ?? req.query.limit) ?? 10, 1), 100);
    const skip = (page - 1) * size;
    const filter: FilterQuery<IOrder> = {};

    if (typeof req.query.status === 'string' && Object.values(OrderStatus).includes(req.query.status as OrderStatus)) {
      filter.status = req.query.status as OrderStatus;
    }

    const [orders, totalElements] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(size).lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        content: orders.map((order) => normalizeOrder(order)),
        number: page - 1,
        size,
        totalPages: Math.ceil(totalElements / size) || 1,
        totalElements,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy danh sách đơn hàng';
    res.status(500).json({ success: false, message });
  }
};

// PATCH /api/orders/:id/status  (admin)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid order id' });
      return;
    }

    const nextStatus = typeof req.query.status === 'string' ? req.query.status : req.body?.status;

    if (!Object.values(OrderStatus).includes(nextStatus as OrderStatus)) {
      res.status(400).json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ' });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status];
    if (!allowedTransitions.includes(nextStatus as OrderStatus)) {
      res.status(400).json({ success: false, message: 'Không thể chuyển trạng thái đơn hàng theo luồng hiện tại' });
      return;
    }

    if (nextStatus === OrderStatus.CANCELLED && order.paymentStatus === PaymentStatus.PAID) {
      res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng đã thanh toán' });
      return;
    }

    order.status = nextStatus as OrderStatus;

    if (nextStatus === OrderStatus.CANCELLED) {
      order.cancelReason = typeof req.query.reason === 'string'
        ? req.query.reason.trim()
        : typeof req.body?.reason === 'string'
          ? req.body.reason.trim()
          : 'Đơn hàng đã bị hủy bởi quản trị viên';
      order.cancelledBy = Role.ADMIN;
    }

    if (nextStatus === OrderStatus.DELIVERED && order.paymentMethod === PaymentMethod.COD) {
      order.paymentStatus = PaymentStatus.PAID;
    }

    await order.save();

    const followUpTasks: Promise<unknown>[] = [
      createOrderStatusNotification(
        order,
        'Cập nhật trạng thái đơn hàng',
        `Đơn hàng ${order.orderCode} đã được cập nhật sang trạng thái ${order.status}.`
      ),
    ];

    if (nextStatus === OrderStatus.CANCELLED) {
      followUpTasks.push(
        ...order.items.map((item) =>
          adjustProductStockForOrderItem(item, item.quantity)
        )
      );
    }

    await Promise.all(followUpTasks);

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: normalizeOrder(order),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái đơn hàng';
    res.status(500).json({ success: false, message });
  }
};

// PATCH /api/orders/:id/cancel
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid order id' });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const isAdmin = authReq.user.role === Role.ADMIN;
    const isOwner = order.userId === authReq.user.id;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn hàng này' });
      return;
    }

    if (order.status === OrderStatus.CANCELLED) {
      res.status(400).json({ success: false, message: 'Đơn hàng đã được hủy trước đó' });
      return;
    }

    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      res.status(400).json({ success: false, message: 'Chỉ có thể hủy đơn hàng đang chờ xác nhận hoặc đã xác nhận' });
      return;
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng đã thanh toán' });
      return;
    }

    const rawReason = typeof req.query.reason === 'string'
      ? req.query.reason
      : typeof req.body?.reason === 'string'
        ? req.body.reason
        : '';
    const cancelReason = rawReason.trim();

    if (cancelReason.length === 0) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do hủy đơn hàng' });
      return;
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelReason = cancelReason;
    order.cancelledBy = isAdmin ? Role.ADMIN : Role.USER;
    await order.save();

    await Promise.all([
      ...order.items.map((item) =>
        adjustProductStockForOrderItem(item, item.quantity)
      ),
      createOrderStatusNotification(
        order,
        'Đơn hàng đã bị hủy',
        `Đơn hàng ${order.orderCode} đã được hủy. Lý do: ${cancelReason}`
      ),
    ]);

    res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: normalizeOrder(order),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể hủy đơn hàng';
    res.status(500).json({ success: false, message });
  }
};
