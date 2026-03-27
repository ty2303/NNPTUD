import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from '../types';

// MODEL 6: Review
export interface IReviewAspect {
  aspect: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
}

export interface IReview extends IBaseDocument {
  productId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  images?: string[];
  analysisResults?: IReviewAspect[];
}

const ReviewAspectSchema = new Schema<IReviewAspect>({
  aspect:     { type: String, required: true },
  sentiment:  { type: String, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'], required: true },
  confidence: { type: Number, min: 0, max: 1 },
}, { _id: false });

const ReviewSchema = new Schema<IReview>(
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

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
