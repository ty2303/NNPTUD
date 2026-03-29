import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Cart, ICart } from '../models/Cart';
import { Product } from '../models/Product';
import { AuthRequest, ICartItem } from '../types';

type CartItemInput = {
  productId?: unknown;
  quantity?: unknown;
};

type SyncCartBody = {
  items?: unknown;
};

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

const normalizeCart = (cart: unknown): Record<string, unknown> => {
  const plainCart = typeof (cart as { toObject?: () => unknown }).toObject === 'function'
    ? ((cart as { toObject: () => unknown }).toObject() as Record<string, unknown>)
    : (cart as Record<string, unknown>);

  const rawId = plainCart._id;
  const id = typeof rawId === 'string'
    ? rawId
    : rawId && typeof rawId === 'object' && 'toString' in rawId
      ? (rawId as { toString(): string }).toString()
      : '';

  return {
    ...plainCart,
    id,
  };
};

const getOrCreateCart = async (userId: string): Promise<ICart> => {
  const existingCart = await Cart.findOne({ userId });
  if (existingCart) {
    return existingCart;
  }

  return Cart.create({ userId, items: [] });
};

const buildCartItem = async (rawItem: CartItemInput): Promise<{ item?: ICartItem; message?: string }> => {
  const productId = typeof rawItem.productId === 'string' ? rawItem.productId.trim() : '';
  const quantity = toNumber(rawItem.quantity);

  if (!productId || !isValidObjectId(productId) || quantity === null || !Number.isInteger(quantity) || quantity <= 0) {
    return { message: 'Thông tin sản phẩm trong giỏ hàng không hợp lệ' };
  }

  const product = await Product.findOne({ _id: productId, isActive: true }).lean();
  if (!product) {
    return { message: 'Sản phẩm không tồn tại hoặc đã ngừng bán' };
  }

  if (product.stock < quantity) {
    return { message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho` };
  }

  return {
    item: {
      productId: product._id.toString(),
      productName: product.name,
      productImage: product.image,
      brand: product.brand,
      price: product.price,
      quantity,
    },
  };
};

// GET /api/cart
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const cart = await getOrCreateCart(authReq.user.id);
    res.status(200).json({ success: true, message: 'Lấy giỏ hàng thành công', data: normalizeCart(cart) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy giỏ hàng';
    res.status(500).json({ success: false, message });
  }
};

// POST /api/cart/items
export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const cart = await getOrCreateCart(authReq.user.id);
    const builtItem = await buildCartItem(req.body as CartItemInput);
    if (!builtItem.item) {
      res.status(400).json({ success: false, message: builtItem.message });
      return;
    }

    const existingItem = cart.items.find((item) => item.productId === builtItem.item!.productId);
    if (existingItem) {
      const nextQuantity = existingItem.quantity + builtItem.item.quantity;
      const rebuiltItem = await buildCartItem({ productId: existingItem.productId, quantity: nextQuantity });
      if (!rebuiltItem.item) {
        res.status(400).json({ success: false, message: rebuiltItem.message });
        return;
      }
      existingItem.quantity = rebuiltItem.item.quantity;
      existingItem.price = rebuiltItem.item.price;
      existingItem.productName = rebuiltItem.item.productName;
      existingItem.productImage = rebuiltItem.item.productImage;
      existingItem.brand = rebuiltItem.item.brand;
    } else {
      cart.items.push(builtItem.item);
    }

    await cart.save();

    res.status(200).json({ success: true, message: 'Thêm sản phẩm vào giỏ hàng thành công', data: normalizeCart(cart) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể thêm sản phẩm vào giỏ hàng';
    res.status(500).json({ success: false, message });
  }
};

// PUT /api/cart/items/:productId
export const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const productId = req.params.productId;
    const quantity = toNumber(req.query.quantity ?? req.body?.quantity);

    if (!isValidObjectId(productId) || quantity === null || !Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({ success: false, message: 'Số lượng cập nhật không hợp lệ' });
      return;
    }

    const cart = await getOrCreateCart(authReq.user.id);
    const itemIndex = cart.items.findIndex((item) => item.productId === productId);

    if (itemIndex === -1) {
      res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ hàng' });
      return;
    }

    const rebuiltItem = await buildCartItem({ productId, quantity });
    if (!rebuiltItem.item) {
      res.status(400).json({ success: false, message: rebuiltItem.message });
      return;
    }

    cart.items[itemIndex] = rebuiltItem.item;
    await cart.save();

    res.status(200).json({ success: true, message: 'Cập nhật giỏ hàng thành công', data: normalizeCart(cart) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể cập nhật giỏ hàng';
    res.status(500).json({ success: false, message });
  }
};

// DELETE /api/cart/items/:productId
export const removeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const cart = await getOrCreateCart(authReq.user.id);
    cart.items = cart.items.filter((item) => item.productId !== req.params.productId);
    await cart.save();

    res.status(200).json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng', data: normalizeCart(cart) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể xóa sản phẩm khỏi giỏ hàng';
    res.status(500).json({ success: false, message });
  }
};

// POST /api/cart/sync
export const syncCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const body = req.body as SyncCartBody;
    if (!Array.isArray(body.items)) {
      res.status(400).json({ success: false, message: 'Dữ liệu đồng bộ giỏ hàng không hợp lệ' });
      return;
    }

    const cart = await getOrCreateCart(authReq.user.id);
    const mergedQuantities = new Map<string, number>();

    for (const item of cart.items) {
      mergedQuantities.set(item.productId, item.quantity);
    }

    for (const item of body.items) {
      if (typeof item !== 'object' || item === null) {
        res.status(400).json({ success: false, message: 'Dữ liệu đồng bộ giỏ hàng không hợp lệ' });
        return;
      }

      const rawItem = item as CartItemInput;
      const productId = typeof rawItem.productId === 'string' ? rawItem.productId.trim() : '';
      const quantity = toNumber(rawItem.quantity);

      if (!productId || quantity === null || !Number.isInteger(quantity) || quantity <= 0) {
        res.status(400).json({ success: false, message: 'Dữ liệu đồng bộ giỏ hàng không hợp lệ' });
        return;
      }

      mergedQuantities.set(productId, (mergedQuantities.get(productId) ?? 0) + quantity);
    }

    const mergedItems: ICartItem[] = [];
    for (const [productId, quantity] of mergedQuantities.entries()) {
      const builtItem = await buildCartItem({ productId, quantity });
      if (!builtItem.item) {
        continue;
      }
      mergedItems.push(builtItem.item);
    }

    cart.items = mergedItems;
    await cart.save();

    res.status(200).json({ success: true, message: 'Đồng bộ giỏ hàng thành công', data: normalizeCart(cart) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể đồng bộ giỏ hàng';
    res.status(500).json({ success: false, message });
  }
};

// DELETE /api/cart
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const cart = await getOrCreateCart(authReq.user.id);
    cart.items = [];
    await cart.save();

    res.status(200).json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng', data: normalizeCart(cart) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể xóa giỏ hàng';
    res.status(500).json({ success: false, message });
  }
};
