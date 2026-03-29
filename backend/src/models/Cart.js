const mongoose = require('mongoose');
const { Schema } = mongoose;

// MODEL 5: Cart (includes CartItem subdocument)
const CartItemSchema = new Schema({
  productId:    { type: String, required: true },
  productName:  { type: String, required: true },
  productImage: { type: String, default: '' },
  color:        { type: String },
  storage:      { type: String },
  price:        { type: Number, required: true },
  quantity:     { type: Number, required: true, min: 1, default: 1 },
}, { _id: false });

const CartSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    items:  [CartItemSchema],
  },
  { timestamps: true }
);

const Cart = mongoose.model('Cart', CartSchema);

module.exports = { Cart };
