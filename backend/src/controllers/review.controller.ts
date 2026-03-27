import { Request, Response } from 'express';
import { AuthRequest } from '../types';

// GET /api/reviews?productId=xxx
export const getReviews = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement get reviews by productId logic
};

// POST /api/reviews
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement create review logic (also recalculate product rating)
};

// PUT /api/reviews/:id
export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement update review logic (check ownership)
};

// DELETE /api/reviews/:id
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement delete review logic (check ownership, recalculate rating)
};

// POST /api/reviews/upload-image
export const uploadReviewImage = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement upload review image to Cloudinary logic
};
