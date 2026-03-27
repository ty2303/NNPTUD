import { Response } from 'express';
import { Wishlist } from '../models/Wishlist';
import { AuthRequest } from '../types';

// GET /api/wishlist
export const getWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user!.id });
    res.json({ success: true, message: 'OK', data: wishlist || { userId: req.user!.id, productIds: [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/wishlist/:productId  (toggle)
export const toggleWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    let wishlist = await Wishlist.findOne({ userId: req.user!.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user!.id, productIds: [productId] });
      res.status(201).json({ success: true, message: 'Added to wishlist', data: wishlist });
      return;
    }

    const idx = wishlist.productIds.indexOf(productId);
    if (idx > -1) {
      wishlist.productIds.splice(idx, 1);
    } else {
      wishlist.productIds.push(productId);
    }
    await wishlist.save();
    res.json({ success: true, message: idx > -1 ? 'Removed from wishlist' : 'Added to wishlist', data: wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// DELETE /api/wishlist
export const clearWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Wishlist.findOneAndUpdate({ userId: req.user!.id }, { productIds: [] });
    res.json({ success: true, message: 'Wishlist cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};
