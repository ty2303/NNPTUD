const mongoose = require('mongoose');
const { Schema } = mongoose;

// MODEL 7: Wishlist
const WishlistSchema = new Schema(
  {
    userId:     { type: String, required: true, unique: true },
    productIds: [{ type: String }],
  },
  { timestamps: true }
);

const Wishlist = mongoose.model('Wishlist', WishlistSchema);

module.exports = { Wishlist };
