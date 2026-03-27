import { Response } from 'express';
import { AuthRequest } from '../types';

// GET /api/addresses
export const getAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement get user addresses logic
};

// POST /api/addresses
export const createAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement create address logic
  // (if isDefault=true, set all other addresses isDefault=false first)
};

// PUT /api/addresses/:id
export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement update address logic
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement delete address logic
};
