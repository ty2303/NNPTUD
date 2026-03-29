const mongoose = require('mongoose');
const { Schema } = mongoose;

// MODEL 10: ReviewAspectAnalysis (standalone analytics record)
const ReviewAspectAnalysisSchema = new Schema(
  {
    reviewId:  { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    aspects: [
      {
        aspect:     { type: String, required: true },
        sentiment:  { type: String, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'], required: true },
        confidence: { type: Number, min: 0, max: 1 },
        _id: false,
      },
    ],
    overallSentiment: { type: String, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'], required: true },
    processedAt:      { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ReviewAspectAnalysis = mongoose.model(
  'ReviewAspectAnalysis',
  ReviewAspectAnalysisSchema
);

module.exports = { ReviewAspectAnalysis };
