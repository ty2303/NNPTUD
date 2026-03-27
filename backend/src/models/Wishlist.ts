import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from '../types';

// MODEL 7: Wishlist
export interface IWishlist extends IBaseDocument {
  userId: string;
  productIds: string[];
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId:     { type: String, required: true, unique: true },
    productIds: [{ type: String }],
  },
  { timestamps: true }
);

export const Wishlist = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
