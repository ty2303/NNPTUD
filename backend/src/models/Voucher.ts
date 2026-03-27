import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from '../types';

// MODEL 8: Voucher
export type VoucherType = 'PERCENT' | 'FIXED';

export interface IVoucher extends IBaseDocument {
  code: string;
  type: VoucherType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usedBy: string[];
}

const VoucherSchema = new Schema<IVoucher>(
  {
    code:           { type: String, required: true, unique: true, uppercase: true },
    type:           { type: String, enum: ['PERCENT', 'FIXED'], required: true },
    value:          { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount:    { type: Number },
    usageLimit:     { type: Number, default: 1 },
    usedCount:      { type: Number, default: 0 },
    startDate:      { type: Date, required: true },
    endDate:        { type: Date, required: true },
    isActive:       { type: Boolean, default: true },
    usedBy:         [{ type: String }],
  },
  { timestamps: true }
);

export const Voucher = mongoose.model<IVoucher>('Voucher', VoucherSchema);
