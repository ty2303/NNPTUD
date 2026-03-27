import { Response } from 'express';
import { uploadToCloudinary } from '../services/cloudinary.service';
import { AuthRequest } from '../types';

// POST /api/upload/image  (admin)
export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }
    const folder = (req.query.folder as string) || 'nnptud/products';
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, folder);
    res.json({ success: true, message: 'Upload successful', data: { url, publicId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed', data: err });
  }
};

// POST /api/upload/images  (admin - multiple)
export const uploadImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files provided' });
      return;
    }
    const folder = (req.query.folder as string) || 'nnptud/products';
    const results = await Promise.all(files.map((f) => uploadToCloudinary(f.buffer, folder)));
    res.json({ success: true, message: 'Upload successful', data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed', data: err });
  }
};
