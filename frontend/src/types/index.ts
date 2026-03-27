// ========================
// Enums
// ========================
export type Role = 'USER' | 'ADMIN';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'COD' | 'MOMO';

// ========================
// Auth
// ========================
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: Role;
  hasPassword: boolean;
  banned: boolean;
  createdAt: string;
}

// ========================
// Product
// ========================
export interface ProductVariant {
  color: string;
  storage: string;
  image: string;
  price: number;
  stock: number;
}

export interface Product {
  _id: string;
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  badge?: string;
  specs?: string;
  description?: string;
  stock: number;
  variants: ProductVariant[];
  isActive: boolean;
  createdAt: string;
}

// ========================
// Category
// ========================
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

// ========================
// Cart
// ========================
export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  color?: string;
  storage?: string;
  price: number;
  quantity: number;
}

export interface Cart {
  _id?: string;
  userId: string;
  items: CartItem[];
}

// ========================
// Order
// ========================
export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  color?: string;
  storage?: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  userId: string;
  orderCode: string;
  email: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  note?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  discountAmount?: number;
  voucherCode?: string;
  cancelReason?: string;
  createdAt: string;
}

// ========================
// Review
// ========================
export interface Review {
  _id: string;
  productId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

// ========================
// Wishlist
// ========================
export interface Wishlist {
  userId: string;
  productIds: string[];
}

// ========================
// Voucher
// ========================
export interface Voucher {
  _id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// ========================
// Notification
// ========================
export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ========================
// Address
// ========================
export interface Address {
  _id: string;
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

// ========================
// API
// ========================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
