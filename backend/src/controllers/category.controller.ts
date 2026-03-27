import { Request, Response } from 'express';


// GET /api/categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement get all categories logic
};

// GET /api/categories/:id
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement get category by id logic
};

// POST /api/categories  (admin)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement create category logic
};

// PUT /api/categories/:id  (admin)
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement update category logic
};

// DELETE /api/categories/:id  (admin)
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  // TODO: implement delete category logic
};
