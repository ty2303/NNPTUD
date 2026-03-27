import { Response } from 'express';
import { AuthRequest } from '../types';

// POST /api/upload/image  (admin)
export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement single image upload to Cloudinary logic
};

// POST /api/upload/images  (admin - multiple files)
export const uploadImages = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement multiple images upload to Cloudinary logic
};
