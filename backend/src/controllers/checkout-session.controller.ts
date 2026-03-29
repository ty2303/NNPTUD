import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { randomUUID } from 'crypto';
import { AuthRequest, NotificationType, OrderStatus, PaymentMethod, PaymentStatus } from '../types';
import { Cart } from '../models/Cart';
import { CheckoutSession, ICheckoutSession, ICheckoutSessionItem } from '../models/CheckoutSession';
import { Notification } from '../models/Notification';
import { Order } from '../models/Order';
import { Product } from '../models/Product';

type CheckoutItemInput = {
  productId?: unknown;
  quantity?: unknown;
  color?: unknown;
  storage?: unknown;
};

type CreateCheckoutSessionBody = {
  source?: unknown;
  items?: unknown;
};

type ConfirmCheckoutSessionBody = {
  email?: unknown;
  customerName?: unknown;
  phone?: unknown;
  address?: unknown;
  city?: unknown;
  district?: unknown;
  ward?: unknown;
  note?: unknown;
  paymentMethod?: unknown;
};

const CHECKOUT_SESSION_TTL_MS = 10 * 60 * 1000;
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

const normalizeCheckoutSession = (session: unknown): Record<string, unknown> => {
  const plainSession = typeof (session as { toObject?: () => unknown }).toObject === 'function'
    ? ((session as { toObject: () => unknown }).toObject() as Record<string, unknown>)
    : (session as Record<string, unknown>);

  const rawId = plainSession._id;
  const id = typeof rawId === 'string'
    ? rawId
    : rawId && typeof rawId === 'object' && 'toString' in rawId
      ? (rawId as { toString(): string }).toString()
      : '';

  return {
    ...plainSession,
    id,
  };
};

const generateOrderCode = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `ORD-${timestamp}-${suffix}`;
};

const isExpired = (session: ICheckoutSession): boolean => session.expiresAt.getTime() <= Date.now();

const expireIfNeeded = async (session: ICheckoutSession): Promise<boolean> => {
  if (session.status === 'ACTIVE' && isExpired(session)) {
    session.status = 'EXPIRED';
    await session.save();
    return true;
  }

  return session.status === 'EXPIRED';
};

const parseRawItems = (value: unknown): { items?: CheckoutItemInput[]; message?: string } => {
  if (!Array.isArray(value) || value.length === 0) {
    return { message: 'Danh sách sản phẩm thanh toán không hợp lệ' };
  }

  const items: CheckoutItemInput[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      return { message: 'Danh sách sản phẩm thanh toán không hợp lệ' };
    }

    items.push(item as CheckoutItemInput);
  }

  return { items };
};

const buildCheckoutItems = async (rawItems: CheckoutItemInput[]): Promise<{ items?: ICheckoutSessionItem[]; message?: string }> => {
  const snapshotItems: ICheckoutSessionItem[] = [];

  for (const item of rawItems) {
    const productId = asNonEmptyString(item.productId);
    const quantity = toNumber(item.quantity);
    const color = asNonEmptyString(item.color) ?? undefined;
    const storage = asNonEmptyString(item.storage) ?? undefined;

    if (!productId || !isValidObjectId(productId) || quantity === null || !Number.isInteger(quantity) || quantity <= 0) {
      return { message: 'Thông tin sản phẩm thanh toán không hợp lệ' };
    }

    const product = await Product.findOne({ _id: productId, isActive: true }).lean();
    if (!product) {
      return { message: 'Có sản phẩm không tồn tại hoặc đã ngừng bán' };
    }

    let resolvedPrice = product.price;
    let resolvedImage = product.image;
    let availableStock = product.stock;

    if (color || storage) {
      const variant = product.variants.find((entry) => {
        const sameColor = color ? entry.color === color : true;
        const sameStorage = storage ? entry.storage === storage : true;
        return sameColor && sameStorage;
      });

      if (!variant) {
        return { message: `Không tìm thấy biến thể hợp lệ cho sản phẩm "${product.name}"` };
      }

      resolvedPrice = variant.price;
      resolvedImage = variant.image || product.image;
      availableStock = variant.stock;
    }

    if (availableStock < quantity) {
      return { message: `Sản phẩm "${product.name}" chỉ còn ${availableStock} trong kho` };
    }

    snapshotItems.push({
      productId: product._id.toString(),
      productName: product.name,
      productImage: resolvedImage,
      brand: product.brand,
      color,
      storage,
      price: resolvedPrice,
      quantity,
    });
  }

  return { items: snapshotItems };
};

const createOrderNotification = async (userId: string, orderCode: string, message: string): Promise<void> => {
  await Notification.create({
    userId,
    type: NotificationType.ORDER,
    title: 'Đơn hàng',
    message: `${orderCode}: ${message}`,
    link: '/profile',
  });
};

const adjustProductStock = async (
  item: ICheckoutSessionItem,
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

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const body = req.body as CreateCheckoutSessionBody;
    const source = asNonEmptyString(body.source);

    if (source !== 'CART' && source !== 'BUY_NOW') {
      res.status(400).json({ success: false, message: 'Nguồn thanh toán không hợp lệ' });
      return;
    }

    const parsedItems = parseRawItems(body.items);
    if (!parsedItems.items) {
      res.status(400).json({ success: false, message: parsedItems.message });
      return;
    }

    const builtItems = await buildCheckoutItems(parsedItems.items);
    if (!builtItems.items) {
      res.status(400).json({ success: false, message: builtItems.message });
      return;
    }

    await CheckoutSession.updateMany(
      { userId: authReq.user.id, status: 'ACTIVE' },
      { $set: { status: 'CANCELLED' } }
    );

    const subtotal = builtItems.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + shippingFee;

    const session = await CheckoutSession.create({
      userId: authReq.user.id,
      source,
      status: 'ACTIVE',
      items: builtItems.items,
      subtotal,
      shippingFee,
      total,
      expiresAt: new Date(Date.now() + CHECKOUT_SESSION_TTL_MS),
    });

    res.status(201).json({
      success: true,
      message: 'Tạo phiên thanh toán thành công',
      data: normalizeCheckoutSession(session),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tạo phiên thanh toán';
    res.status(500).json({ success: false, message });
  }
};

export const getCheckoutSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid checkout session id' });
      return;
    }

    const session = await CheckoutSession.findById(req.params.id);
    if (!session || session.userId !== authReq.user.id) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phiên thanh toán' });
      return;
    }

    if (await expireIfNeeded(session)) {
      res.status(410).json({ success: false, message: 'Phiên thanh toán đã hết hạn' });
      return;
    }

    if (session.status !== 'ACTIVE') {
      res.status(400).json({ success: false, message: 'Phiên thanh toán không còn khả dụng' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lấy phiên thanh toán thành công',
      data: normalizeCheckoutSession(session),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy phiên thanh toán';
    res.status(500).json({ success: false, message });
  }
};

export const confirmCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid checkout session id' });
      return;
    }

    const session = await CheckoutSession.findById(req.params.id);
    if (!session || session.userId !== authReq.user.id) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phiên thanh toán' });
      return;
    }

    if (await expireIfNeeded(session)) {
      res.status(410).json({ success: false, message: 'Phiên thanh toán đã hết hạn' });
      return;
    }

    if (session.status !== 'ACTIVE') {
      res.status(400).json({ success: false, message: 'Phiên thanh toán không còn khả dụng' });
      return;
    }

    const body = req.body as ConfirmCheckoutSessionBody;
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

    for (const item of session.items) {
      const product = await Product.findById(item.productId).lean();
      if (!product || !product.isActive) {
        res.status(400).json({ success: false, message: `Sản phẩm "${item.productName}" không còn khả dụng` });
        return;
      }

      let availableStock = product.stock;
      if (item.color || item.storage) {
        const variant = product.variants.find((entry) => {
          const sameColor = item.color ? entry.color === item.color : true;
          const sameStorage = item.storage ? entry.storage === item.storage : true;
          return sameColor && sameStorage;
        });

        if (!variant) {
          res.status(400).json({ success: false, message: `Biến thể của sản phẩm "${item.productName}" không còn khả dụng` });
          return;
        }

        availableStock = variant.stock;
      }

      if (availableStock < item.quantity) {
        res.status(400).json({ success: false, message: `Sản phẩm "${item.productName}" không đủ tồn kho để đặt hàng` });
        return;
      }
    }

    const order = await Order.create({
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
      items: session.items,
      subtotal: session.subtotal,
      shippingFee: session.shippingFee,
      total: session.total,
    });

    session.status = 'COMPLETED';
    session.orderId = order._id.toString();
    session.completedAt = new Date();
    await session.save();

    await Promise.all([
      ...session.items.map((item) => adjustProductStock(item, -item.quantity)),
      session.source === 'CART'
        ? Cart.findOneAndUpdate(
            { userId: authReq.user.id },
            {
              $pull: {
                items: {
                  productId: { $in: session.items.map((item) => item.productId) },
                },
              },
            }
          )
        : Promise.resolve(null),
      createOrderNotification(authReq.user.id, order.orderCode, 'Đơn hàng của bạn đã được tạo thành công.'),
    ]);

    res.status(200).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: {
        order: {
          ...(order.toObject() as unknown as Record<string, unknown>),
          id: order._id.toString(),
        },
        checkoutSession: normalizeCheckoutSession(session),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể xác nhận thanh toán';
    res.status(500).json({ success: false, message });
  }
};

export const cancelCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid checkout session id' });
      return;
    }

    const session = await CheckoutSession.findById(req.params.id);
    if (!session || session.userId !== authReq.user.id) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phiên thanh toán' });
      return;
    }

    if (session.status === 'COMPLETED') {
      res.status(400).json({ success: false, message: 'Phiên thanh toán đã hoàn tất' });
      return;
    }

    if (session.status === 'ACTIVE') {
      session.status = isExpired(session) ? 'EXPIRED' : 'CANCELLED';
      await session.save();
    }

    res.status(200).json({
      success: true,
      message: 'Đã đóng phiên thanh toán',
      data: normalizeCheckoutSession(session),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể đóng phiên thanh toán';
    res.status(500).json({ success: false, message });
  }
};
