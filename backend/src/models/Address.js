const mongoose = require('mongoose');
const { Schema } = mongoose;

// MODEL 13: Address (saved delivery addresses per user)
const AddressSchema = new Schema(
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

const Address = mongoose.model('Address', AddressSchema);

module.exports = { Address };
