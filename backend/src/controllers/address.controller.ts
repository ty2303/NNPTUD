import { Request, Response } from 'express';


// GET /api/addresses
export const getAddresses = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement get user addresses logic
};

// POST /api/addresses
export const createAddress = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement create address logic
  // (if isDefault=true, set all other addresses isDefault=false first)
};

// PUT /api/addresses/:id
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement update address logic
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement delete address logic
};
