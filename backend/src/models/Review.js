const mongoose = require('mongoose');
const { Schema } = mongoose;

// MODEL 6: Review
const ReviewAspectSchema = new Schema({
  aspect:     { type: String, required: true },
  sentiment:  { type: String, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'], required: true },
  confidence: { type: Number, min: 0, max: 1 },
}, { _id: false });

const ReviewSchema = new Schema(
  {
    productId:       { type: String, required: true },
    userId:          { type: String, required: true },
    username:        { type: String, required: true },
    rating:          { type: Number, required: true, min: 1, max: 5 },
    comment:         { type: String, required: true, trim: true },
    images:          [{ type: String }],
    analysisResults: [ReviewAspectSchema],
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ userId: 1 });

const Review = mongoose.model('Review', ReviewSchema);

module.exports = { Review };
