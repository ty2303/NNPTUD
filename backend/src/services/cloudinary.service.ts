// TODO: implement Cloudinary upload service

// Upload single image buffer to Cloudinary
// Returns: { url: string, publicId: string }
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string = 'nnptud'
): Promise<{ url: string; publicId: string }> => {
  // TODO: use cloudinary.uploader.upload_stream with streamifier
  return Promise.resolve({ url: '', publicId: '' });
};

// Delete image from Cloudinary by publicId
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // TODO: use cloudinary.uploader.destroy(publicId)
};
