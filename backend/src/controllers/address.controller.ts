import { Response } from 'express';
import { Address } from '../models/Address';
import { AuthRequest } from '../types';

// GET /api/addresses
export const getAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const addresses = await Address.find({ userId: req.user!.id }).sort({ isDefault: -1 });
    res.json({ success: true, message: 'OK', data: addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/addresses
export const createAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.body.isDefault) {
      await Address.updateMany({ userId: req.user!.id }, { isDefault: false });
    }
    const address = await Address.create({ ...req.body, userId: req.user!.id });
    res.status(201).json({ success: true, message: 'Address created', data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.body.isDefault) {
      await Address.updateMany({ userId: req.user!.id }, { isDefault: false });
    }
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      req.body,
      { new: true }
    );
    if (!address) { res.status(404).json({ success: false, message: 'Address not found' }); return; }
    res.json({ success: true, message: 'Address updated', data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Address.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};
