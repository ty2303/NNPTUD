import mongoose, { Schema } from 'mongoose';
import { IBaseDocument, IProductVariant } from '../types';

// MODEL 3: Product (includes ProductVariant subdocument)
export interface IProduct extends IBaseDocument {
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  badge?: string;
  specs?: string;
  description?: string;
  stock: number;
  variants: IProductVariant[];
  isActive: boolean;
}

const ProductVariantSchema = new Schema<IProductVariant>({
  color:   { type: String, required: true },
  storage: { type: String, required: true },
  image:   { type: String, default: '' },
  price:   { type: Number, required: true, min: 0 },
  stock:   { type: Number, required: true, min: 0, default: 0 },
}, { _id: false });

const ProductSchema = new Schema<IProduct>(
  {
    name:          { type: String, required: true, trim: true },
    brand:         { type: String, required: true, trim: true },
    categoryId:    { type: String, required: true },
    price:         { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    image:         { type: String, required: true },
    images:        [{ type: String }],
    rating:        { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:   { type: Number, default: 0 },
    badge:         { type: String },
    specs:         { type: String },
    description:   { type: String },
    stock:         { type: Number, default: 0, min: 0 },
    variants:      [ProductVariantSchema],
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', brand: 'text' });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ price: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
