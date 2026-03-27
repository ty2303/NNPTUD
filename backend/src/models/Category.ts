import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from '../types';

// MODEL 2: Category
export interface ICategory extends IBaseDocument {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    icon:        { type: String, default: '' },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
