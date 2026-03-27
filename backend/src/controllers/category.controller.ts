import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { AuthRequest } from '../types';

// GET /api/categories
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, message: 'OK', data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// GET /api/categories/:id
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) { res.status(404).json({ success: false, message: 'Category not found' }); return; }
    res.json({ success: true, message: 'OK', data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/categories  (admin)
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, icon } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const category = await Category.create({ name, slug, description, icon });
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PUT /api/categories/:id  (admin)
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.body.name) req.body.slug = req.body.name.toLowerCase().replace(/\s+/g, '-');
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) { res.status(404).json({ success: false, message: 'Category not found' }); return; }
    res.json({ success: true, message: 'Category updated', data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// DELETE /api/categories/:id  (admin)
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) { res.status(404).json({ success: false, message: 'Category not found' }); return; }
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};
