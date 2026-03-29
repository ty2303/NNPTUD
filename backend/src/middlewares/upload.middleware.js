const multer = require('multer');

// TODO: implement multer upload middleware
// - Chỉ cho phép file ảnh: jpeg, png, webp, gif
// - Giới hạn kích thước: 5MB
// - Dùng memoryStorage (lưu vào buffer để upload lên Cloudinary)

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(null, false);
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
    parts: 20,
  },
});

const uploadSingle = upload.single('image');
const uploadMultiple = upload.array('images', 10);

module.exports = { fileFilter, upload, uploadSingle, uploadMultiple };
