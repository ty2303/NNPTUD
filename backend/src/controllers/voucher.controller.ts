import { Request, Response } from 'express';
import { Voucher } from '../models/Voucher';
import { AuthRequest } from '../types';

// GET /api/vouchers  (admin)
export const getAllVouchers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    res.json({ success: true, message: 'OK', data: vouchers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/vouchers/validate  (user - check if voucher valid)
export const validateVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, orderAmount } = req.body;
    const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });

    if (!voucher) { res.status(404).json({ success: false, message: 'Voucher not found or inactive' }); return; }
    if (new Date() < voucher.startDate || new Date() > voucher.endDate) {
      res.status(400).json({ success: false, message: 'Voucher expired or not yet valid' }); return;
    }
    if (voucher.usedCount >= voucher.usageLimit) {
      res.status(400).json({ success: false, message: 'Voucher usage limit reached' }); return;
    }
    if (orderAmount < voucher.minOrderAmount) {
      res.status(400).json({ success: false, message: `Minimum order amount is ${voucher.minOrderAmount}` }); return;
    }
    if (voucher.usedBy.includes(req.user!.id)) {
      res.status(400).json({ success: false, message: 'You have already used this voucher' }); return;
    }

    let discount = voucher.type === 'PERCENT'
      ? (orderAmount * voucher.value) / 100
      : voucher.value;
    if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);

    res.json({ success: true, message: 'Voucher valid', data: { voucher, discount } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/vouchers  (admin)
export const createVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const voucher = await Voucher.create({ ...req.body, code: req.body.code.toUpperCase() });
    res.status(201).json({ success: true, message: 'Voucher created', data: voucher });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PUT /api/vouchers/:id  (admin)
export const updateVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!voucher) { res.status(404).json({ success: false, message: 'Voucher not found' }); return; }
    res.json({ success: true, message: 'Voucher updated', data: voucher });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// DELETE /api/vouchers/:id  (admin)
export const deleteVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Voucher deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};
