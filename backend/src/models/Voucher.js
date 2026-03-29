const mongoose = require('mongoose');
const { Schema } = mongoose;

// MODEL 8: Voucher
const VoucherSchema = new Schema(
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

const Voucher = mongoose.model('Voucher', VoucherSchema);

module.exports = { Voucher };
