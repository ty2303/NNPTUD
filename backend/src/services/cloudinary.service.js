const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

// Upload single image buffer to Cloudinary
// Returns: { url: string, publicId: string }
const uploadToCloudinary = (
  buffer,
  folder = 'nnptud'
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url || !result.public_id) {
          reject(new Error('Cloudinary upload did not return expected data'));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Delete image from Cloudinary by publicId
const deleteFromCloudinary = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Failed to delete Cloudinary asset: ${result.result}`);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
