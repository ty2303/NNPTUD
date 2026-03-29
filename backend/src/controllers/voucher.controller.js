// GET /api/vouchers  (admin)
const getAllVouchers = async (req, res) => {
  // TODO: implement get all vouchers logic
};

// POST /api/vouchers/validate
const validateVoucher = async (req, res) => {
  // TODO: implement validate voucher code logic
  // (check: active, not expired, usage limit, min order amount, not used by this user)
};

// POST /api/vouchers  (admin)
const createVoucher = async (req, res) => {
  // TODO: implement create voucher logic
};

// PUT /api/vouchers/:id  (admin)
const updateVoucher = async (req, res) => {
  // TODO: implement update voucher logic
};

// DELETE /api/vouchers/:id  (admin)
const deleteVoucher = async (req, res) => {
  // TODO: implement delete voucher logic
};

module.exports = {
  getAllVouchers,
  validateVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
};
