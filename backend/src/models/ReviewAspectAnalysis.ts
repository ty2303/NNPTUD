import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from '../types';

// MODEL 10: ReviewAspectAnalysis (standalone analytics record)
export interface IReviewAspectAnalysis extends IBaseDocument {
  reviewId: string;
  productId: string;
  aspects: {
    aspect: string;
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    confidence: number;
  }[];
  overallSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  processedAt: Date;
}

const ReviewAspectAnalysisSchema = new Schema<IReviewAspectAnalysis>(
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

export const ReviewAspectAnalysis = mongoose.model<IReviewAspectAnalysis>(
  'ReviewAspectAnalysis',
  ReviewAspectAnalysisSchema
);
