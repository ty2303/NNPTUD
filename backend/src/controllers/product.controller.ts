import { Request, Response } from 'express';
import { AuthRequest } from '../types';

// GET /api/products
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement get all products with pagination, search, filter logic
};

// GET /api/products/:id
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement get product by id logic
};

// POST /api/products  (admin)
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement create product logic
};

// PUT /api/products/:id  (admin)
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement update product logic
};

// DELETE /api/products/:id  (admin)
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: implement delete (soft delete) product logic
};
