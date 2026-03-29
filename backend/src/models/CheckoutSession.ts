import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from '../types';

export type CheckoutSource = 'CART' | 'BUY_NOW';
export type CheckoutSessionStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface ICheckoutSessionItem {
  productId: string;
  productName: string;
  productImage: string;
  brand?: string;
  color?: string;
  storage?: string;
  price: number;
  quantity: number;
}

export interface ICheckoutSession extends IBaseDocument {
  userId: string;
  source: CheckoutSource;
  status: CheckoutSessionStatus;
  items: ICheckoutSessionItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  expiresAt: Date;
  orderId?: string;
  completedAt?: Date;
}

const CheckoutSessionItemSchema = new Schema<ICheckoutSessionItem>({
  productId:    { type: String, required: true },
  productName:  { type: String, required: true },
  productImage: { type: String, default: '' },
  brand:        { type: String },
  color:        { type: String },
  storage:      { type: String },
  price:        { type: Number, required: true, min: 0 },
  quantity:     { type: Number, required: true, min: 1 },
}, { _id: false });

const CheckoutSessionSchema = new Schema<ICheckoutSession>(
  {
    userId:      { type: String, required: true, index: true },
    source:      { type: String, enum: ['CART', 'BUY_NOW'], required: true },
    status:      { type: String, enum: ['ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE', index: true },
    items:       [CheckoutSessionItemSchema],
    subtotal:    { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total:       { type: Number, required: true, min: 0 },
    expiresAt:   { type: Date, required: true, index: true },
    orderId:     { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

CheckoutSessionSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const CheckoutSession = mongoose.model<ICheckoutSession>('CheckoutSession', CheckoutSessionSchema);
