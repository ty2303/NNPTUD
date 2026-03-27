import { Response } from 'express';
import { Cart } from '../models/Cart';
import { AuthRequest, ICartItem } from '../types';

// GET /api/cart
export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cart = await Cart.findOne({ userId: req.user!.id });
    res.json({ success: true, message: 'OK', data: cart || { userId: req.user!.id, items: [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/cart/items
export const addItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item: ICartItem = req.body;
    const cart = await Cart.findOne({ userId: req.user!.id });

    if (!cart) {
      const newCart = await Cart.create({ userId: req.user!.id, items: [item] });
      res.status(201).json({ success: true, message: 'Item added', data: newCart });
      return;
    }

    const existingIdx = cart.items.findIndex(
      (i) => i.productId === item.productId && i.color === item.color && i.storage === item.storage
    );

    if (existingIdx > -1) {
      cart.items[existingIdx].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }
    await cart.save();
    res.json({ success: true, message: 'Item added', data: cart });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PUT /api/cart/items/:productId
export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quantity, color, storage } = req.body;
    const cart = await Cart.findOne({ userId: req.user!.id });
    if (!cart) { res.status(404).json({ success: false, message: 'Cart not found' }); return; }

    const idx = cart.items.findIndex(
      (i) => i.productId === req.params.productId && i.color === color && i.storage === storage
    );
    if (idx === -1) { res.status(404).json({ success: false, message: 'Item not found in cart' }); return; }

    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }
    await cart.save();
    res.json({ success: true, message: 'Cart updated', data: cart });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// DELETE /api/cart/items/:productId
export const removeItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cart = await Cart.findOne({ userId: req.user!.id });
    if (!cart) { res.status(404).json({ success: false, message: 'Cart not found' }); return; }
    cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
    await cart.save();
    res.json({ success: true, message: 'Item removed', data: cart });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/cart/sync
export const syncCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guestItems: ICartItem[] = req.body.items || [];
    let cart = await Cart.findOne({ userId: req.user!.id });

    if (!cart) {
      cart = await Cart.create({ userId: req.user!.id, items: guestItems });
    } else {
      for (const gItem of guestItems) {
        const idx = cart.items.findIndex(
          (i) => i.productId === gItem.productId && i.color === gItem.color && i.storage === gItem.storage
        );
        if (idx > -1) cart.items[idx].quantity += gItem.quantity;
        else cart.items.push(gItem);
      }
      await cart.save();
    }
    res.json({ success: true, message: 'Cart synced', data: cart });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// DELETE /api/cart
export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user!.id }, { items: [] });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};
