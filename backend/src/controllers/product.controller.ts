import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { AuthRequest } from '../types';

// GET /api/products
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 12, search, category, brand, minPrice, maxPrice, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query: Record<string, unknown> = { isActive: true };
    if (search)   query.$text = { $search: String(search) };
    if (category) query.categoryId = String(category);
    if (brand)    query.brand = { $regex: String(brand), $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) (query.price as Record<string, unknown>).$gte = +minPrice;
      if (maxPrice) (query.price as Record<string, unknown>).$lte = +maxPrice;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [String(sortBy)]: sortOrder })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Product.countDocuments(query),
    ]);

    res.json({ success: true, message: 'OK', data: { products, total, page: +page, totalPages: Math.ceil(total / +limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// GET /api/products/:id
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
    res.json({ success: true, message: 'OK', data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// POST /api/products  (admin)
export const createProduct = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.create(_req.body);
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// PUT /api/products/:id  (admin)
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
    res.json({ success: true, message: 'Product updated', data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};

// DELETE /api/products/:id  (admin)
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: err });
  }
};
