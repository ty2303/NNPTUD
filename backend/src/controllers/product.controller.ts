import { Request, Response } from 'express';
import { FilterQuery, isValidObjectId } from 'mongoose';
import { Product, IProduct } from '../models/Product';
import { Category } from '../models/Category';
import { AuthRequest, IProductVariant } from '../types';

type ProductRequestBody = {
  name?: unknown;
  brand?: unknown;
  categoryId?: unknown;
  price?: unknown;
  originalPrice?: unknown;
  image?: unknown;
  images?: unknown;
  rating?: unknown;
  reviewCount?: unknown;
  badge?: unknown;
  specs?: unknown;
  description?: unknown;
  stock?: unknown;
  variants?: unknown;
  isActive?: unknown;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
};

const toOptionalNumber = (value: unknown): number | undefined | null => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return toNumber(value);
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return [];
    }

    try {
      const parsedValue: unknown = JSON.parse(trimmedValue);
      if (Array.isArray(parsedValue)) {
        return parsedValue
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
    } catch {
      return trimmedValue
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }

  return undefined;
};

const parseVariants = (value: unknown): IProductVariant[] | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  let rawVariants: unknown = value;

  if (typeof value === 'string') {
    if (value.trim().length === 0) {
      return [];
    }

    try {
      rawVariants = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }

  if (!Array.isArray(rawVariants)) {
    return null;
  }

  const parsedVariants: IProductVariant[] = [];

  for (const variant of rawVariants) {
    if (typeof variant !== 'object' || variant === null) {
      return null;
    }

    const record = variant as Record<string, unknown>;
    const color = typeof record.color === 'string' ? record.color.trim() : '';
    const storage = typeof record.storage === 'string' ? record.storage.trim() : '';
    const image = typeof record.image === 'string' ? record.image.trim() : '';
    const price = toNumber(record.price);
    const stock = toNumber(record.stock);

    if (!color || !storage || price === null || stock === null || price < 0 || stock < 0) {
      return null;
    }

    parsedVariants.push({ color, storage, image, price, stock });
  }

  return parsedVariants;
};

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }
  }

  return undefined;
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const parseProductPayload = (body: ProductRequestBody): { data?: Partial<IProduct>; message?: string } => {
  const payload: Partial<IProduct> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return { message: 'Product name is required' };
    }
    payload.name = body.name.trim();
  }

  if (body.brand !== undefined) {
    if (typeof body.brand !== 'string' || body.brand.trim().length === 0) {
      return { message: 'Product brand is required' };
    }
    payload.brand = body.brand.trim();
  }

  if (body.categoryId !== undefined) {
    if (typeof body.categoryId !== 'string' || body.categoryId.trim().length === 0) {
      return { message: 'Category is required' };
    }
    payload.categoryId = body.categoryId.trim();
  }

  if (body.price !== undefined) {
    const price = toNumber(body.price);
    if (price === null || price < 0) {
      return { message: 'Product price must be a non-negative number' };
    }
    payload.price = price;
  }

  if (body.originalPrice !== undefined) {
    const originalPrice = toOptionalNumber(body.originalPrice);
    if (originalPrice === null) {
      payload.originalPrice = undefined;
    } else if (originalPrice !== undefined && originalPrice < 0) {
      return { message: 'Original price must be a non-negative number' };
    } else if (originalPrice !== undefined) {
      payload.originalPrice = originalPrice;
    }
  }

  if (body.image !== undefined) {
    if (typeof body.image !== 'string' || body.image.trim().length === 0) {
      return { message: 'Product image is required' };
    }
    payload.image = body.image.trim();
  }

  if (body.images !== undefined) {
    const images = toStringArray(body.images);
    if (!images) {
      return { message: 'Product images must be an array of strings' };
    }
    payload.images = images;
  }

  if (body.rating !== undefined) {
    const rating = toNumber(body.rating);
    if (rating === null || rating < 0 || rating > 5) {
      return { message: 'Rating must be a number between 0 and 5' };
    }
    payload.rating = rating;
  }

  if (body.reviewCount !== undefined) {
    const reviewCount = toNumber(body.reviewCount);
    if (reviewCount === null || reviewCount < 0) {
      return { message: 'Review count must be a non-negative number' };
    }
    payload.reviewCount = reviewCount;
  }

  if (body.badge !== undefined) {
    if (typeof body.badge !== 'string') {
      return { message: 'Badge must be a string' };
    }
    payload.badge = body.badge.trim();
  }

  if (body.specs !== undefined) {
    if (typeof body.specs !== 'string') {
      return { message: 'Specs must be a string' };
    }
    payload.specs = body.specs.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      return { message: 'Description must be a string' };
    }
    payload.description = body.description.trim();
  }

  if (body.stock !== undefined) {
    const stock = toNumber(body.stock);
    if (stock === null || stock < 0) {
      return { message: 'Stock must be a non-negative number' };
    }
    payload.stock = stock;
  }

  if (body.variants !== undefined) {
    const variants = parseVariants(body.variants);
    if (variants === null) {
      return { message: 'Variants must be a valid array of product variants' };
    }
    payload.variants = variants;
  }

  if (body.isActive !== undefined) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) {
      return { message: 'isActive must be a boolean' };
    }
    payload.isActive = isActive;
  }

  return { data: payload };
};

const buildProductFilter = (req: Request): FilterQuery<IProduct> => {
  const filter: FilterQuery<IProduct> = { isActive: true };

  if (typeof req.query.search === 'string' && req.query.search.trim().length > 0) {
    const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ name: regex }, { brand: regex }];
  }

  if (typeof req.query.categoryId === 'string' && req.query.categoryId.trim().length > 0) {
    filter.categoryId = req.query.categoryId.trim();
  }

  if (typeof req.query.brand === 'string' && req.query.brand.trim().length > 0) {
    filter.brand = new RegExp(`^${escapeRegex(req.query.brand.trim())}$`, 'i');
  }

  const minPrice = toNumber(req.query.minPrice);
  const maxPrice = toNumber(req.query.maxPrice);

  if (minPrice !== null || maxPrice !== null) {
    const priceFilter: { $gte?: number; $lte?: number } = {};

    if (minPrice !== null) {
      priceFilter.$gte = minPrice;
    }

    if (maxPrice !== null) {
      priceFilter.$lte = maxPrice;
    }

    filter.price = priceFilter;
  }

  return filter;
};

const resolveSort = (sortBy: unknown, order: unknown): Record<string, 1 | -1> => {
  const allowedSortFields = new Set(['createdAt', 'updatedAt', 'price', 'rating', 'reviewCount', 'name', 'stock']);
  const safeSortBy = typeof sortBy === 'string' && allowedSortFields.has(sortBy) ? sortBy : 'createdAt';
  const safeOrder = order === 'asc' ? 1 : -1;
  return { [safeSortBy]: safeOrder };
};

// GET /api/products
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(toNumber(req.query.page) ?? 1, 1);
    const limit = Math.min(Math.max(toNumber(req.query.limit) ?? 10, 1), 100);
    const skip = (page - 1) * limit;
    const filter = buildProductFilter(req);
    const sort = resolveSort(req.query.sortBy, req.query.order);

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: {
        data: products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    res.status(500).json({ success: false, message });
  }
};

// GET /api/products/:id
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid product id' });
      return;
    }

    const product = await Product.findOne({ _id: req.params.id, isActive: true }).lean();

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Product fetched successfully',
      data: product,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch product';
    res.status(500).json({ success: false, message });
  }
};

// POST /api/products  (admin)
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: payload, message } = parseProductPayload(req.body as ProductRequestBody);

    if (!payload) {
      res.status(400).json({ success: false, message });
      return;
    }

    if (!payload.name || !payload.brand || !payload.categoryId || payload.price === undefined || !payload.image) {
      res.status(400).json({
        success: false,
        message: 'name, brand, categoryId, price, and image are required',
      });
      return;
    }

    if (!isValidObjectId(payload.categoryId)) {
      res.status(400).json({ success: false, message: 'Invalid category id' });
      return;
    }

    const categoryExists = await Category.exists({ _id: payload.categoryId });
    if (!categoryExists) {
      res.status(400).json({ success: false, message: 'Category not found' });
      return;
    }

    const product = await Product.create({
      ...payload,
      images: payload.images ?? [],
      variants: payload.variants ?? [],
      rating: payload.rating ?? 0,
      reviewCount: payload.reviewCount ?? 0,
      stock: payload.stock ?? 0,
      isActive: payload.isActive ?? true,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    res.status(500).json({ success: false, message });
  }
};

// PUT /api/products/:id  (admin)
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid product id' });
      return;
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const { data: payload, message } = parseProductPayload(req.body as ProductRequestBody);

    if (!payload) {
      res.status(400).json({ success: false, message });
      return;
    }

    if (payload.categoryId) {
      if (!isValidObjectId(payload.categoryId)) {
        res.status(400).json({ success: false, message: 'Invalid category id' });
        return;
      }

      const categoryExists = await Category.exists({ _id: payload.categoryId });
      if (!categoryExists) {
        res.status(400).json({ success: false, message: 'Category not found' });
        return;
      }
    }

    if (payload.isActive === true && !payload.categoryId) {
      const categoryExists = await Category.exists({ _id: product.categoryId });
      if (!categoryExists) {
        res.status(400).json({
          success: false,
          message: 'Cannot reactivate product because its category no longer exists',
        });
        return;
      }
    }

    Object.assign(product, payload);
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    res.status(500).json({ success: false, message });
  }
};

// DELETE /api/products/:id  (admin)
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid product id' });
      return;
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    res.status(500).json({ success: false, message });
  }
};
