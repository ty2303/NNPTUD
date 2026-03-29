import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { AuthRequest } from '../types';

const buildSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const isDuplicateKeyError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return 'code' in error && error.code === 11000;
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeProductCount = req.query.includeProductCount === 'true';
    const categories = await Category.find().sort({ name: 1 }).lean();

    if (!includeProductCount) {
      res.status(200).json({
        success: true,
        message: 'Categories fetched successfully',
        data: categories,
      });
      return;
    }

    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        productCount: await Product.countDocuments({ categoryId: category._id.toString(), isActive: true }),
      }))
    );

    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: categoriesWithCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch categories';
    res.status(500).json({ success: false, message });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid category id' });
      return;
    }

    const category = await Category.findById(req.params.id).lean();
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Category fetched successfully',
      data: category,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch category';
    res.status(500).json({ success: false, message });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, icon } = req.body;

    if (typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }

    const resolvedSlug = typeof slug === 'string' && slug.trim().length > 0 ? buildSlug(slug) : buildSlug(name);
    if (!resolvedSlug) {
      res.status(400).json({ success: false, message: 'Category slug is invalid' });
      return;
    }

    const category = await Category.create({
      name: name.trim(),
      slug: resolvedSlug,
      description: typeof description === 'string' ? description.trim() : '',
      icon: typeof icon === 'string' ? icon.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ success: false, message: 'Category name or slug already exists' });
      return;
    }

    const message = error instanceof Error ? error.message : 'Failed to create category';
    res.status(500).json({ success: false, message });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid category id' });
      return;
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const { name, slug, description, icon } = req.body;

    if (typeof name === 'string') {
      if (name.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Category name cannot be empty' });
        return;
      }

      category.name = name.trim();
    }

    if (typeof slug === 'string') {
      const resolvedSlug = buildSlug(slug);
      if (!resolvedSlug) {
        res.status(400).json({ success: false, message: 'Category slug is invalid' });
        return;
      }

      category.slug = resolvedSlug;
    } else if (typeof name === 'string') {
      category.slug = buildSlug(name);
    }

    if (typeof description === 'string') {
      category.description = description.trim();
    }

    if (typeof icon === 'string') {
      category.icon = icon.trim();
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ success: false, message: 'Category name or slug already exists' });
      return;
    }

    const message = error instanceof Error ? error.message : 'Failed to update category';
    res.status(500).json({ success: false, message });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid category id' });
      return;
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const linkedProducts = await Product.countDocuments({ categoryId: category._id.toString(), isActive: true });
    if (linkedProducts > 0) {
      res.status(409).json({
        success: false,
        message: 'Cannot delete category while active products still belong to it',
      });
      return;
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    res.status(500).json({ success: false, message });
  }
};
