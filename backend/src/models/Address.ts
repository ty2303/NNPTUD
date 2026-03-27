import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from '../types';

// MODEL 13: Address (saved delivery addresses per user)
export interface IAddress extends IBaseDocument {
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId:    { type: String, required: true },
    fullName:  { type: String, required: true },
    phone:     { type: String, required: true },
    address:   { type: String, required: true },
    ward:      { type: String, required: true },
    district:  { type: String, required: true },
    city:      { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AddressSchema.index({ userId: 1 });

export const Address = mongoose.model<IAddress>('Address', AddressSchema);
