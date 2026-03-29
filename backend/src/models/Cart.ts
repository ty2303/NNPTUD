import mongoose, { Schema } from 'mongoose';
import { IBaseDocument, ICartItem } from '../types';

// MODEL 5: Cart (includes CartItem subdocument)
export interface ICart extends IBaseDocument {
  userId: string;
  items: ICartItem[];
}

const CartItemSchema = new Schema<ICartItem>({
  productId:    { type: String, required: true },
  productName:  { type: String, required: true },
  productImage: { type: String, default: '' },
  brand:        { type: String },
  color:        { type: String },
  storage:      { type: String },
  price:        { type: Number, required: true },
  quantity:     { type: Number, required: true, min: 1, default: 1 },
}, { _id: false });

const CartSchema = new Schema<ICart>(
  {
    userId: { type: String, required: true, unique: true },
    items:  [CartItemSchema],
  },
  { timestamps: true }
);

export const Cart = mongoose.model<ICart>('Cart', CartSchema);
