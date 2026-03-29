const mongoose = require('mongoose');
const { Schema } = mongoose;
const { OrderStatus, PaymentMethod, PaymentStatus } = require('../types');

// MODEL 4: Order (includes OrderItem subdocument)
const OrderItemSchema = new Schema({
  productId:    { type: String, required: true },
  productName:  { type: String, required: true },
  productImage: { type: String, default: '' },
  color:        { type: String },
  storage:      { type: String },
  price:        { type: Number, required: true },
  quantity:     { type: Number, required: true, min: 1 },
}, { _id: false });

const OrderSchema = new Schema(
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

const Order = mongoose.model('Order', OrderSchema);

module.exports = { Order };
