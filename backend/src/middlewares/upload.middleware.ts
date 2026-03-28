import multer from 'multer';
import { Request } from 'express';

// TODO: implement multer upload middleware
// - Chỉ cho phép file ảnh: jpeg, png, webp, gif
// - Giới hạn kích thước: 5MB
// - Dùng memoryStorage (lưu vào buffer để upload lên Cloudinary)

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(null, false);
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
    parts: 20,
  },
});

export const uploadSingle   = upload.single('image');
export const uploadMultiple = upload.array('images', 10);
