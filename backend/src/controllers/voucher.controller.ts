import { Request, Response } from 'express';


// GET /api/vouchers  (admin)
export const getAllVouchers = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement get all vouchers logic
};

// POST /api/vouchers/validate
export const validateVoucher = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement validate voucher code logic
  // (check: active, not expired, usage limit, min order amount, not used by this user)
};

// POST /api/vouchers  (admin)
export const createVoucher = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement create voucher logic
};

// PUT /api/vouchers/:id  (admin)
export const updateVoucher = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement update voucher logic
};

// DELETE /api/vouchers/:id  (admin)
export const deleteVoucher = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement delete voucher logic
};
