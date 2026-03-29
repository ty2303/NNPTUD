// GET /api/wishlist
const getWishlist = async (req, res) => {
  // TODO: implement get user wishlist logic
};

// POST /api/wishlist/:productId  (toggle add/remove)
const toggleWishlist = async (req, res) => {
  // TODO: implement toggle product in wishlist logic
};

// DELETE /api/wishlist
const clearWishlist = async (req, res) => {
  // TODO: implement clear entire wishlist logic
};

module.exports = {
  getWishlist,
  toggleWishlist,
  clearWishlist,
};
