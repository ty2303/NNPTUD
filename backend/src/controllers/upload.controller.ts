import { Response } from 'express';
import { deleteFromCloudinary, uploadToCloudinary } from '../services/cloudinary.service';
import { AuthRequest } from '../types';

const getUploadFolder = (folder: unknown): string => {
  if (typeof folder !== 'string' || folder.trim().length === 0) {
    return 'nnptud';
  }

  return folder.trim();
};

export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Image file is required and must be jpeg, png, webp, or gif',
      });
      return;
    }

    const folder = getUploadFolder(req.body.folder);
    const image = await uploadToCloudinary(req.file.buffer, folder);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: image,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    res.status(500).json({ success: false, message });
  }
};

export const uploadImages = async (req: AuthRequest, res: Response): Promise<void> => {
  const uploadedImages: Array<{ url: string; publicId: string }> = [];

  try {
    const files = Array.isArray(req.files) ? req.files : [];

    if (files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one image file is required and must be jpeg, png, webp, or gif',
      });
      return;
    }

    const folder = getUploadFolder(req.body.folder);

    for (const file of files) {
      const uploadedImage = await uploadToCloudinary(file.buffer, folder);
      uploadedImages.push(uploadedImage);
    }

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: uploadedImages,
    });
  } catch (error) {
    await Promise.all(
      uploadedImages.map(async (image) => {
        try {
          await deleteFromCloudinary(image.publicId);
        } catch {
          return;
        }
      })
    );

    const message = error instanceof Error ? error.message : 'Failed to upload images';
    res.status(500).json({ success: false, message });
  }
};
