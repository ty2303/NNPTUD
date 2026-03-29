// GET /api/reviews?productId=xxx
const getReviews = async (req, res) => {
  // TODO: implement get reviews by productId logic
};

// POST /api/reviews
const createReview = async (req, res) => {
  // TODO: implement create review logic (also recalculate product rating)
};

// PUT /api/reviews/:id
const updateReview = async (req, res) => {
  // TODO: implement update review logic (check ownership)
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
  // TODO: implement delete review logic (check ownership, recalculate rating)
};

// POST /api/reviews/upload-image
const uploadReviewImage = async (req, res) => {
  // TODO: implement upload review image to Cloudinary logic
};

module.exports = {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  uploadReviewImage,
};
