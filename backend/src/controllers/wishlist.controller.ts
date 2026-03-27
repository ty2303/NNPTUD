import { Response } from 'express';
import { AuthRequest } from '../types';

// GET /api/wishlist
export const getWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement get user wishlist logic
};

// POST /api/wishlist/:productId  (toggle add/remove)
export const toggleWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement toggle product in wishlist logic
};

// DELETE /api/wishlist
export const clearWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement clear entire wishlist logic
};
