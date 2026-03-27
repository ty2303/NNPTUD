import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { uploadToCloudinary } from '../services/cloudinary.service';
import { AuthRequest } from '../types';

const recalcRating = async (productId: string) => {
  const reviews = await Review.find({ productId });
  if (!reviews.length) { await Product.findByIdAndUpdate(productId, { rating: 0, reviewCount: 0 }); return; }
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Product.findByIdAndUpdate(productId, { rating: parseFloat(avg.toFixed(1)), reviewCount: reviews.length });
};

// GET /api/reviews?productId=xxx
export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.query;
    if (!productId) { res.status(400).json({ success: false, message: 'productId is required' }); return; }
    const reviews = await Review.find({ productId: String(productId) }).sort({ createdAt: -1 });
    res.json({ success: true, message: 'OK', data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/reviews
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.create({ ...req.body, userId: req.user!.id, username: req.body.username || req.user!.email });
    await recalcRating(review.productId);
    res.status(201).json({ success: true, message: 'Review created', data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PUT /api/reviews/:id
export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) { res.status(404).json({ success: false, message: 'Review not found' }); return; }
    if (review.userId !== req.user!.id) { res.status(403).json({ success: false, message: 'Forbidden' }); return; }
    Object.assign(review, req.body);
    await review.save();
    await recalcRating(review.productId);
    res.json({ success: true, message: 'Review updated', data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// DELETE /api/reviews/:id
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) { res.status(404).json({ success: false, message: 'Review not found' }); return; }
    if (review.userId !== req.user!.id) { res.status(403).json({ success: false, message: 'Forbidden' }); return; }
    const { productId } = review;
    await review.deleteOne();
    await recalcRating(productId);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/reviews/upload-image
export const uploadReviewImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }
    const { url } = await uploadToCloudinary(req.file.buffer, 'nnptud/reviews');
    res.json({ success: true, message: 'Image uploaded', data: { url } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};
