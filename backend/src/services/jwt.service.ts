import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload } from '../types';

// Access token: ngắn hạn (15 phút)
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: '15m' } as jwt.SignOptions);
};

// Refresh token: dài hạn (7 ngày)
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: '7d' } as jwt.SignOptions);
};

// Tạo cả 2 token cùng lúc
export const generateTokens = (payload: JwtPayload): { accessToken: string; refreshToken: string } => {
  return {
    accessToken:  generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
};

// Giữ lại để tương thích (dùng access token)
export const generateToken  = generateAccessToken;
export const verifyToken    = verifyAccessToken;
