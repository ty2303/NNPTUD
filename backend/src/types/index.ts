import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ========================
// Enum Types
// ========================
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  COD = 'COD',
  MOMO = 'MOMO',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum NotificationType {
  ORDER = 'ORDER',
  REVIEW = 'REVIEW',
  SYSTEM = 'SYSTEM',
  PROMOTION = 'PROMOTION',
}

export enum ImportJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ========================
// Base Document Interface
// ========================
export interface IBaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// Auth Types
// ========================
export type AuthRequest = Request;

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

// ========================
// Product Types
// ========================
export interface IProductVariant {
  color: string;
  storage: string;
  image: string;
  price: number;
  stock: number;
}

// ========================
// Order Types
// ========================
export interface IOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  brand?: string;
  color?: string;
  storage?: string;
  price: number;
  quantity: number;
}

// ========================
// Cart Types
// ========================
export interface ICartItem {
  productId: string;
  productName: string;
  productImage: string;
  brand?: string;
  color?: string;
  storage?: string;
  price: number;
  quantity: number;
}

// ========================
// Pagination
// ========================
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================
// API Response
// ========================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
