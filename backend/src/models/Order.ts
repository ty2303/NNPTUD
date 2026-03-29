import mongoose, { Schema } from 'mongoose';
import { IBaseDocument, IOrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '../types';

// MODEL 4: Order (includes OrderItem subdocument)
export interface IOrder extends IBaseDocument {
  userId: string;
  orderCode: string;
  email: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  note?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  discountAmount?: number;
  voucherCode?: string;
  momoTransId?: string;
  cancelReason?: string;
  cancelledBy?: string;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId:    { type: String, required: true },
  productName:  { type: String, required: true },
  productImage: { type: String, default: '' },
  brand:        { type: String },
  color:        { type: String },
  storage:      { type: String },
  price:        { type: Number, required: true },
  quantity:     { type: Number, required: true, min: 1 },
}, { _id: false });

const OrderSchema = new Schema<IOrder>(
  {
    userId:         { type: String, required: true },
    orderCode:      { type: String, required: true, unique: true },
    email:          { type: String, required: true },
    customerName:   { type: String, required: true },
    phone:          { type: String, required: true },
    address:        { type: String, required: true },
    city:           { type: String, required: true },
    district:       { type: String, required: true },
    ward:           { type: String, required: true },
    note:           { type: String },
    paymentMethod:  { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.COD },
    paymentStatus:  { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.UNPAID },
    status:         { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
    items:          [OrderItemSchema],
    subtotal:       { type: Number, required: true, min: 0 },
    shippingFee:    { type: Number, default: 0 },
    total:          { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0 },
    voucherCode:    { type: String },
    momoTransId:    { type: String },
    cancelReason:   { type: String },
    cancelledBy:    { type: String },
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderCode: 1 });
OrderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
